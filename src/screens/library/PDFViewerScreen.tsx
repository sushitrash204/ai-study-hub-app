import React from 'react';
import {
        View, StyleSheet, TouchableOpacity, Text,
        ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const MIN_ZOOM_PERCENT = 50;
const MAX_ZOOM_PERCENT = 250;

const DEFAULT_VIEWER_STATE = {
        ready: false,
        zoom: 100,
        currentPage: 1,
        totalPages: 0,
};

const createPdfHtml = (pdfUrl: string) => `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <title>PDF Viewer</title>
        <style>
            html, body {
                margin: 0;
                padding: 0;
                min-height: 100%;
                background-color: #f3f4f6;
                overflow: auto;
                font-family: sans-serif;
            }

            body {
                padding: 12px 0 24px;
                box-sizing: border-box;
            }

            #container {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 100%;
                box-sizing: border-box;
            }

            .page-wrapper {
                margin-bottom: 20px;
            }

            canvas {
                display: block;
                background: #fff;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
            }

            .error-msg {
                text-align: center;
                color: #ff3b30;
                padding: 40px 20px;
                font-family: sans-serif;
                font-size: 16px;
            }

            #loader {
                text-align: center;
                padding: 40px 0;
                color: #6b7280;
                font-family: sans-serif;
            }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    </head>
    <body>
        <div id="loader">Đang khởi tạo trình xem PDF...</div>
        <div id="container"></div>
        <script>
            const url = ${JSON.stringify(pdfUrl)};
            const container = document.getElementById('container');
            const loader = document.getElementById('loader');
            const MIN_ZOOM = 0.5;
            const MAX_ZOOM = 2.5;
            const ZOOM_STEP = 0.25;
            let pdfDocument = null;
            let zoomMultiplier = 1;
            let currentPage = 1;
            let renderVersion = 0;
            let scrollFrame = null;

            const postMessage = (type, payload = {}) => {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
                }
            };

            const getViewerWidth = () => Math.max(window.innerWidth - 24, 280);

            const buildViewport = (page) => {
                const baseViewport = page.getViewport({ scale: 1 });
                const fitScale = getViewerWidth() / baseViewport.width;
                return page.getViewport({ scale: fitScale * zoomMultiplier });
            };

            const sendState = () => {
                postMessage('viewerState', {
                    ready: Boolean(pdfDocument),
                    zoom: Math.round(zoomMultiplier * 100),
                    currentPage,
                    totalPages: pdfDocument ? pdfDocument.numPages : 0,
                });
            };

            const scrollToPage = (pageNumber, behavior = 'smooth') => {
                const maxPage = pdfDocument ? pdfDocument.numPages : 1;
                const nextPage = Math.max(1, Math.min(pageNumber, maxPage));
                const pageElement = document.getElementById('page-' + nextPage);

                currentPage = nextPage;

                if (pageElement) {
                    pageElement.scrollIntoView({ behavior, block: 'start' });
                }

                sendState();
            };

            const detectCurrentPage = () => {
                if (!pdfDocument) {
                    return;
                }

                const pageElements = document.querySelectorAll('.page-wrapper');
                let closestPage = currentPage;
                let closestDistance = Number.POSITIVE_INFINITY;

                pageElements.forEach((pageElement, index) => {
                    const distance = Math.abs(pageElement.getBoundingClientRect().top - 72);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPage = index + 1;
                    }
                });

                if (closestPage !== currentPage) {
                    currentPage = closestPage;
                    sendState();
                }
            };

            window.addEventListener('scroll', () => {
                if (scrollFrame) {
                    window.cancelAnimationFrame(scrollFrame);
                }

                scrollFrame = window.requestAnimationFrame(() => {
                    detectCurrentPage();
                });
            }, { passive: true });

            window.addEventListener('resize', () => {
                if (!pdfDocument) {
                    return;
                }

                renderAllPages(true);
            });

            const renderAllPages = (keepPagePosition = true) => {
                if (!pdfDocument) {
                    return;
                }

                const targetPage = currentPage;
                const currentRenderVersion = ++renderVersion;

                loader.style.display = 'block';
                loader.textContent = 'Đang render ' + pdfDocument.numPages + ' trang...';
                container.innerHTML = '';

                const renders = [];

                for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
                    const pageWrapper = document.createElement('div');
                    pageWrapper.className = 'page-wrapper';
                    pageWrapper.id = 'page-' + pageNumber;
                    container.appendChild(pageWrapper);

                    const renderPromise = pdfDocument.getPage(pageNumber).then((page) => {
                        if (currentRenderVersion !== renderVersion) {
                            return null;
                        }

                        const viewport = buildViewport(page);
                        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');

                        canvas.width = Math.floor(viewport.width * outputScale);
                        canvas.height = Math.floor(viewport.height * outputScale);
                        canvas.style.width = viewport.width + 'px';
                        canvas.style.height = viewport.height + 'px';
                        pageWrapper.style.width = viewport.width + 'px';
                        pageWrapper.innerHTML = '';
                        pageWrapper.appendChild(canvas);

                        return page.render({
                            canvasContext: context,
                            viewport,
                            transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
                        }).promise;
                    });

                    renders.push(renderPromise);
                }

                Promise.all(renders).then(() => {
                    if (currentRenderVersion !== renderVersion) {
                        return;
                    }

                    loader.style.display = 'none';

                    if (keepPagePosition) {
                        scrollToPage(targetPage, 'auto');
                        return;
                    }

                    sendState();
                }).catch((error) => {
                    if (currentRenderVersion !== renderVersion) {
                        return;
                    }

                    loader.style.display = 'none';
                    container.innerHTML = '<div class="error-msg">Không thể hiển thị PDF trực tiếp.<br/>Vui lòng nhấn nút "Download" để mở ngoài.<br/><br/><small>' + error.message + '</small></div>';
                    postMessage('error', { message: error.message });
                });
            };

            const setZoom = (nextZoom) => {
                const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));

                if (Math.abs(boundedZoom - zoomMultiplier) < 0.001) {
                    sendState();
                    return;
                }

                zoomMultiplier = boundedZoom;
                renderAllPages(true);
            };

            const handleCommand = (command) => {
                if (!pdfDocument || !command || !command.type) {
                    return;
                }

                switch (command.type) {
                    case 'zoom_in':
                        setZoom(zoomMultiplier + ZOOM_STEP);
                        break;
                    case 'zoom_out':
                        setZoom(zoomMultiplier - ZOOM_STEP);
                        break;
                    case 'page_next':
                        scrollToPage(currentPage + 1);
                        break;
                    case 'page_prev':
                        scrollToPage(currentPage - 1);
                        break;
                    default:
                        break;
                }
            };

            window.__PDF_VIEWER__ = { handleCommand };

            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

            pdfjsLib.getDocument(url).promise.then((pdf) => {
                pdfDocument = pdf;
                postMessage('viewerReady', {
                    ready: true,
                    zoom: Math.round(zoomMultiplier * 100),
                    currentPage,
                    totalPages: pdf.numPages,
                });
                renderAllPages(false);
            }).catch((error) => {
                loader.style.display = 'none';
                container.innerHTML = '<div class="error-msg">Không thể hiển thị PDF trực tiếp.<br/>Vui lòng nhấn nút "Download" để mở ngoài.<br/><br/><small>' + error.message + '</small></div>';
                postMessage('error', { message: error.message });
            });
        </script>
    </body>
</html>
`;

export default function PDFViewerScreen({ route, navigation }: any) {
    const { url, title, documentId } = route.params;
    const webViewRef = React.useRef<any>(null);
    const [isOpeningExternal, setIsOpeningExternal] = React.useState(false);
    const [viewerState, setViewerState] = React.useState(DEFAULT_VIEWER_STATE);
    const [viewerSource, setViewerSource] = React.useState(() => ({ html: createPdfHtml(url), baseUrl: '' }));

    React.useEffect(() => {
        setViewerState(DEFAULT_VIEWER_STATE);
        setViewerSource({ html: createPdfHtml(url), baseUrl: '' });
    }, [url]);

    const handleOpenExternal = async () => {
        try {
            setIsOpeningExternal(true);
            const fileName = title ? title.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_') : 'document';
            const fileUri = FileSystem.cacheDirectory + fileName + '.pdf';

            const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
            const downloadResult = await downloadResumable.downloadAsync();

            if (downloadResult && await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadResult.uri);
            } else {
                Alert.alert('Thông báo', 'Thiết bị không hỗ trợ chia sẻ tệp');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể mở tài liệu bằng ứng dụng ngoài');
        } finally {
            setIsOpeningExternal(false);
        }
    };

    const sendViewerCommand = (type: 'zoom_in' | 'zoom_out' | 'page_next' | 'page_prev') => {
        webViewRef.current?.injectJavaScript(
            `window.__PDF_VIEWER__ && window.__PDF_VIEWER__.handleCommand(${JSON.stringify({ type })}); true;`
        );
    };

    const handleViewerMessage = (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message.type === 'viewerReady' || message.type === 'viewerState') {
                setViewerState((currentState) => ({
                    ready: Boolean(message.ready ?? currentState.ready),
                    zoom: message.zoom ?? currentState.zoom,
                    currentPage: message.currentPage ?? currentState.currentPage,
                    totalPages: message.totalPages ?? currentState.totalPages,
                }));
            }
        } catch {
            // Ignore malformed messages from the embedded viewer.
        }
    };

    const canZoomOut = viewerState.ready && viewerState.zoom > MIN_ZOOM_PERCENT;
    const canZoomIn = viewerState.ready && viewerState.zoom < MAX_ZOOM_PERCENT;
    const canGoPrevious = viewerState.ready && viewerState.currentPage > 1;
    const canGoNext = viewerState.ready && viewerState.totalPages > 0 && viewerState.currentPage < viewerState.totalPages;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>{title || 'Tài liệu'}</Text>
                    <Text style={styles.subtitle}>Đại học Bách Khoa • 2.4 MB</Text>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                <WebView
                    ref={webViewRef}
                    source={viewerSource}
                    style={styles.webview}
                    startInLoadingState={true}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mixedContentMode="always"
                    onMessage={handleViewerMessage}
                    renderLoading={() => (
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Đang xử lý tài liệu...</Text>
                        </View>
                    )}
                />
            </View>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.mainActions}>
                    <TouchableOpacity style={styles.askAiBtn} onPress={() => {
                        if (!documentId) {
                            Alert.alert('Không có tài liệu', 'Không tìm thấy ID tài liệu để mở chat.');
                            return;
                        }
                        navigation.navigate('Main', {
                            screen: 'Chat',
                            params: {
                                summaryDocumentId: documentId,
                                summaryTitle: title || 'Tài liệu PDF',
                                summaryRequestId: `pdf-${documentId}-${Date.now()}`,
                            },
                        });
                    }}>
                        <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                        <Text style={styles.askAiBtnText}>Hỏi AI</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.downloadBtn} onPress={handleOpenExternal}>
                        {isOpeningExternal ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={20} color="#fff" />
                                <Text style={styles.downloadBtnText}>Download</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* PDF Controls */}
                <View style={styles.pdfControls}>
                    <View style={styles.zoomControl}>
                        <TouchableOpacity
                            style={[styles.controlButton, !canZoomOut && styles.controlButtonDisabled]}
                            onPress={() => sendViewerCommand('zoom_out')}
                            disabled={!canZoomOut}
                        >
                            <Ionicons name="remove-circle-outline" size={24} color={canZoomOut ? '#1F2937' : '#9CA3AF'} />
                        </TouchableOpacity>
                        <Text style={styles.zoomText}>{viewerState.zoom}%</Text>
                        <TouchableOpacity
                            style={[styles.controlButton, !canZoomIn && styles.controlButtonDisabled]}
                            onPress={() => sendViewerCommand('zoom_in')}
                            disabled={!canZoomIn}
                        >
                            <Ionicons name="add-circle-outline" size={24} color={canZoomIn ? '#1F2937' : '#9CA3AF'} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pageControl}>
                        <TouchableOpacity
                            style={[styles.pageBtn, !canGoPrevious && styles.pageBtnDisabled]}
                            onPress={() => sendViewerCommand('page_prev')}
                            disabled={!canGoPrevious}
                        >
                            <Ionicons name="chevron-back" size={20} color={canGoPrevious ? '#1F2937' : '#9CA3AF'} />
                        </TouchableOpacity>
                        <Text style={styles.pageText}>
                            <Text style={styles.pageTextBold}>{viewerState.currentPage}</Text>
                            {viewerState.totalPages > 0 ? ` / ${viewerState.totalPages}` : ' / --'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.pageBtn, !canGoNext && styles.pageBtnDisabled]}
                            onPress={() => sendViewerCommand('page_next')}
                            disabled={!canGoNext}
                        >
                            <Ionicons name="chevron-forward" size={20} color={canGoNext ? '#1F2937' : '#9CA3AF'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Constants.statusBarHeight + 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    actionButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    titleContainer: {
        flex: 1,
        marginLeft: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    webview: { flex: 1, backgroundColor: '#FAFAFA' },
    loading: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA',
    },
    loadingText: { marginTop: 15, color: '#6B7280', fontWeight: '500' },

    // Bottom Bar
    bottomBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    mainActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    askAiBtn: {
        flexDirection: 'row',
        flex: 1,
        marginRight: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#8B5CF6',
        borderRadius: 25,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    askAiBtnText: {
        color: '#8B5CF6',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    downloadBtn: {
        flexDirection: 'row',
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#8B5CF6',
        borderRadius: 25,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    downloadBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    pdfControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    zoomControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    controlButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonDisabled: {
        opacity: 0.5,
    },
    zoomText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginHorizontal: 15,
    },
    pageControl: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pageBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageBtnDisabled: {
        opacity: 0.5,
    },
    pageText: {
        fontSize: 14,
        color: '#6B7280',
        marginHorizontal: 15,
    },
    pageTextBold: {
        fontWeight: 'bold',
        color: '#1F2937',
    },
});
