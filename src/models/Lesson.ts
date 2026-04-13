export type LessonBlock = {
    id: string;
    type: 'header' | 'paragraph' | 'image' | 'math' | 'quote' | 'bullet_list' | 'callout' | 'divider';
    data?: {
        text?: string;
        url?: string;
        caption?: string;
        expression?: string;
        author?: string;
        items?: string[];
        tone?: 'info' | 'success' | 'warning';
    };
};

export class LessonModel {
    id: string;
    title: string;
    description?: string;
    order: number;
    status: 'DRAFT' | 'PUBLIC';
    contentStyle: 'BLOCKS' | 'HTML';
    content?: LessonBlock[];
    subjectId?: string;
    createdAt?: string;
    updatedAt?: string;

    constructor(data: any) {
        this.id = data?.id || '';
        this.title = data?.title || '';
        this.description = data?.description || '';
        this.order = data?.order || 0;
        this.status = data?.status || 'DRAFT';
        this.contentStyle = data?.contentStyle || 'BLOCKS';
        this.content = Array.isArray(data?.content) ? data.content : [];
        this.subjectId = data?.subjectId || '';
        this.createdAt = data?.createdAt;
        this.updatedAt = data?.updatedAt;
    }
}
