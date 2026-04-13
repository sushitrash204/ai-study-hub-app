import api from './api';
import { Subject } from '../models/Subject';
import { LessonModel } from '../models/Lesson';

export const getSubjects = async (): Promise<Subject[]> => {
    const response = await api.get('/subjects');
    if (Array.isArray(response.data)) {
        return response.data.map(item => new Subject(item));
    }
    return [];
};

export const getClasses = async (): Promise<any[]> => {
    const response = await api.get('/subjects/classes');
    return response.data || [];
};

export const getSystemSubjects = async (classId?: string): Promise<Subject[]> => {
    const response = await api.get('/subjects/system', { params: { classId } });
    if (Array.isArray(response.data)) {
        return response.data.map(item => new Subject(item));
    }
    return [];
};

export const createSubject = async (name: string, color?: string, classId?: string): Promise<Subject> => {
    const response = await api.post('/subjects', { name, color, classId });
    return new Subject(response.data);
};

export const updateSubject = async (id: string, name: string, color?: string): Promise<Subject> => {
    const response = await api.put(`/subjects/${id}`, { name, color });
    return new Subject(response.data);
};

export const deleteSubject = async (id: string): Promise<any> => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
};

export const getSubjectLessons = async (subjectId: string): Promise<LessonModel[]> => {
    try {
        const response = await api.get(`/subjects/${subjectId}/lessons`);
        if (!Array.isArray(response.data)) return [];
        return response.data.map((item: any) => new LessonModel(item));
    } catch (error: any) {
        if (error?.response?.status === 404) {
            return [];
        }
        throw error;
    }
};

export const getSubjectLessonDetail = async (subjectId: string, lessonId: string): Promise<LessonModel> => {
    const response = await api.get(`/subjects/${subjectId}/lessons/${lessonId}`);
    return new LessonModel(response.data);
};
