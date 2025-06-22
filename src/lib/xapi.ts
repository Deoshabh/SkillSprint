// src/lib/xapi.ts
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface XAPIActor {
  objectType: 'Agent';
  name: string;
  mbox: string;
}

export interface XAPIVerb {
  id: string;
  display: { [key: string]: string };
}

export interface XAPIObject {
  objectType: 'Activity';
  id: string;
  definition?: {
    name?: { [key: string]: string };
    description?: { [key: string]: string };
    type?: string;
  };
}

export interface XAPIResult {
  score?: {
    scaled?: number;
    raw?: number;
    min?: number;
    max?: number;
  };
  success?: boolean;
  completion?: boolean;
  duration?: string;
}

export interface XAPIStatement {
  id?: string;
  actor: XAPIActor;
  verb: XAPIVerb;
  object: XAPIObject;
  result?: XAPIResult;
  timestamp?: string;
  context?: {
    contextActivities?: {
      parent?: XAPIObject[];
      grouping?: XAPIObject[];
    };
    platform?: string;
  };
}

export class XAPIClient {
  private client: AxiosInstance;
  private endpoint: string;
  private auth: string;

  constructor(endpoint: string, auth: string) {
    this.endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
    this.auth = auth;
    
    this.client = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Authorization': this.auth,
        'Content-Type': 'application/json',
        'X-Experience-API-Version': '1.0.3'
      },
      timeout: 10000
    });
  }

  async sendStatement(statement: XAPIStatement): Promise<void> {
    try {
      // Ensure statement has required fields
      const completeStatement: XAPIStatement = {
        ...statement,
        id: statement.id || uuidv4(),
        timestamp: statement.timestamp || new Date().toISOString()
      };

      console.log('Sending xAPI statement:', completeStatement);
      
      const response = await this.client.post('statements', completeStatement);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('xAPI statement sent successfully:', response.data);
      } else {
        console.error('Failed to send xAPI statement:', response.status, response.data);
      }
    } catch (error) {
      console.error('Error sending xAPI statement:', error);
      // Don't throw error to prevent breaking the user experience
    }
  }

  async sendStatements(statements: XAPIStatement[]): Promise<void> {
    try {
      const completeStatements = statements.map(statement => ({
        ...statement,
        id: statement.id || uuidv4(),
        timestamp: statement.timestamp || new Date().toISOString()
      }));

      console.log('Sending multiple xAPI statements:', completeStatements);
      
      const response = await this.client.post('statements', completeStatements);
      
      if (response.status >= 200 && response.status < 300) {
        console.log('xAPI statements sent successfully:', response.data);
      } else {
        console.error('Failed to send xAPI statements:', response.status, response.data);
      }
    } catch (error) {
      console.error('Error sending xAPI statements:', error);
    }
  }

  async getStatements(params: {
    agent?: XAPIActor;
    activity?: string;
    limit?: number;
    since?: string;
    until?: string;
  } = {}): Promise<any> {
    try {
      const response = await this.client.get('statements', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching xAPI statements:', error);
      return null;
    }
  }
}

// Predefined xAPI verbs for SkillSprint
export const XAPI_VERBS = {
  COMPLETED: {
    id: 'http://adlnet.gov/expapi/verbs/completed',
    display: { 'en-US': 'completed' }
  },
  EXPERIENCED: {
    id: 'http://adlnet.gov/expapi/verbs/experienced',
    display: { 'en-US': 'experienced' }
  },
  ATTEMPTED: {
    id: 'http://adlnet.gov/expapi/verbs/attempted',
    display: { 'en-US': 'attempted' }
  },
  PASSED: {
    id: 'http://adlnet.gov/expapi/verbs/passed',
    display: { 'en-US': 'passed' }
  },
  FAILED: {
    id: 'http://adlnet.gov/expapi/verbs/failed',
    display: { 'en-US': 'failed' }
  },
  WATCHED: {
    id: 'https://w3id.org/xapi/video/verbs/watched',
    display: { 'en-US': 'watched' }
  },
  ANSWERED: {
    id: 'http://adlnet.gov/expapi/verbs/answered',
    display: { 'en-US': 'answered' }
  }
} as const;

// Activity types for SkillSprint
export const XAPI_ACTIVITY_TYPES = {
  COURSE: 'http://adlnet.gov/expapi/activities/course',
  MODULE: 'http://adlnet.gov/expapi/activities/lesson',
  VIDEO: 'https://w3id.org/xapi/video/activity-type/video',
  QUIZ: 'http://adlnet.gov/expapi/activities/assessment',
  QUESTION: 'http://adlnet.gov/expapi/activities/question'
} as const;

// Helper functions to create xAPI objects
export function createActor(name: string, email: string): XAPIActor {
  return {
    objectType: 'Agent',
    name: name,
    mbox: `mailto:${email}`
  };
}

export function createActivity(
  id: string, 
  name: string, 
  description: string, 
  type: string
): XAPIObject {
  return {
    objectType: 'Activity',
    id: id,
    definition: {
      name: { 'en-US': name },
      description: { 'en-US': description },
      type: type
    }
  };
}

// Global xAPI client instance
let xapiClient: XAPIClient | null = null;

export function getXAPIClient(): XAPIClient {
  if (!xapiClient) {
    const endpoint = process.env.MONGODB_LRS_ENDPOINT || process.env.NEXT_PUBLIC_LRS_ENDPOINT || '';
    const auth = process.env.MONGODB_LRS_AUTH || process.env.NEXT_PUBLIC_LRS_AUTH || '';
    
    if (!endpoint || !auth) {
      console.warn('xAPI LRS endpoint or auth not configured. xAPI tracking will be disabled.');
      // Return a mock client that doesn't actually send statements
      return {
        sendStatement: async () => console.log('xAPI disabled - no LRS configured'),
        sendStatements: async () => console.log('xAPI disabled - no LRS configured'),
        getStatements: async () => null
      } as unknown as XAPIClient;
    }
    
    xapiClient = new XAPIClient(endpoint, auth);
  }
  
  return xapiClient;
}

// Platform context for all statements
export const SKILLSPRINT_CONTEXT = {
  platform: 'SkillSprint',
  contextActivities: {
    grouping: [{
      objectType: 'Activity' as const,
      id: 'https://skillsprint.app',
      definition: {
        name: { 'en-US': 'SkillSprint Learning Platform' },
        type: 'http://id.tincanapi.com/activitytype/software-application'
      }
    }]
  }
};
