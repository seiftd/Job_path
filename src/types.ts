export enum Language {
  ENGLISH = 'en',
  ARABIC = 'ar'
}

export enum ViewState {
  DASHBOARD = 'dashboard',
  RESUME_BUILDER = 'resume_builder',
  JOB_MATCH = 'job_match',
  INTERVIEW_SETUP = 'interview_setup',
  INTERVIEW_SESSION = 'interview_session',
  FEEDBACK = 'feedback',
  HISTORY_DETAILS = 'history_details'
}

export enum InterviewType {
  HR = 'HR',
  TECHNICAL = 'Technical',
  BEHAVIORAL = 'Behavioral'
}

export enum TemplateType {
  PROFESSIONAL = 'professional',
  MODERN = 'modern',
  CREATIVE = 'creative'
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface InterviewRecord {
  id: string;
  date: number;
  jobTitle: string;
  type: InterviewType;
  transcript: {sender: 'user' | 'ai', text: string}[];
  feedback: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    tips: string[];
  };
}

export interface UserProfile {
  name: string;
  photo?: string;
  summary: string;
  email: string;
  phone: string;
  skills: string[];
  languages: string[];
  experience: Experience[];
  education: string;
  targetRole?: string;
  interviewHistory: InterviewRecord[];
}

export interface JobRecommendation {
  title: string;
  matchScore: number;
  missingSkills: string[];
  avgSalary: string;
  description: string;
}

export interface InterviewMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface InterviewSessionConfig {
  jobTitle: string;
  type: InterviewType;
  mode: 'text' | 'voice';
}