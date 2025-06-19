import yaml from 'js-yaml';

import * as XLSX from 'xlsx';

// Core interfaces
export interface CourseImportPreview {
  topic: string;
  youtubeLinks: string[];
  pdfLinks: string[];
  docLinks: string[];
  uploadedDocuments: UploadedDocument[];
  metadata: Record<string, any>;
  error?: string;
  week?: string;
  subtopics?: string[];
  tasks?: string[];
  description?: string;
  duration?: string;
  difficulty?: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx';
  size: number;
  url: string;
  uploadedAt: string;
  userId?: string;
}

export interface ImportValidationResult {
  valid: CourseImportPreview[];
  invalid: CourseImportPreview[];
  summary: {
    total: number;
    validCount: number;
    invalidCount: number;
    errors: string[];
  };
}

// Check if a YouTube video is actually available and embeddable
export async function checkYouTubeVideoAvailability(embedUrl: string): Promise<boolean> {
  try {
    // Extract video ID from embed URL
    const videoIdMatch = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    const playlistMatch = embedUrl.match(/videoseries\?list=([a-zA-Z0-9_-]+)/);
    
    if (videoIdMatch) {
      // For individual videos, try to fetch the oembed data
      const videoId = videoIdMatch[1];
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
      const response = await fetch(oembedUrl);
      return response.ok;
    } else if (playlistMatch) {
      // For playlists, we assume they're available (harder to check)
      // YouTube playlists are generally more stable than individual videos
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to check YouTube video availability:', error);
    // If we can't check, we'll assume it's available to avoid blocking
    return true;
  }
}

// YouTube URL validation helper
export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const cleanUrl = url.trim();
  
  // Check if it's a YouTube domain
  const isYoutubeDomain = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
  if (!isYoutubeDomain) return false;
  
  // Very permissive validation - just check for basic YouTube URL patterns
  // This accepts most YouTube URLs including those with additional parameters
  const hasValidYouTubePattern = (
    cleanUrl.includes('watch?v=') ||           // Standard watch URLs
    cleanUrl.includes('embed/') ||             // Embed URLs  
    cleanUrl.includes('playlist?list=') ||     // Playlist URLs
    cleanUrl.includes('youtu.be/') ||          // Short URLs
    cleanUrl.includes('/v/') ||                // Old format
    cleanUrl.includes('channel/') ||           // Channel URLs
    cleanUrl.includes('/c/') ||                // Channel custom URLs
    cleanUrl.includes('/@') ||                 // New handle format
    cleanUrl.includes('user/') ||              // User URLs
    cleanUrl.includes('videoseries?list=')     // Playlist embed
  );
  
  // Additional check for URLs that might have the video ID in different positions
  const videoIdPattern = /[?&]v=([a-zA-Z0-9_-]{11})/;
  const playlistIdPattern = /[?&]list=([a-zA-Z0-9_-]+)/;
  const shortUrlPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const embedPattern = /embed\/([a-zA-Z0-9_-]{11})/;
  
  const hasVideoId = videoIdPattern.test(cleanUrl) || 
                    shortUrlPattern.test(cleanUrl) || 
                    embedPattern.test(cleanUrl);
  const hasPlaylistId = playlistIdPattern.test(cleanUrl);
  
  return hasValidYouTubePattern || hasVideoId || hasPlaylistId;
}

// PDF URL validation helper
export function isPdfUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const cleanUrl = url.trim().toLowerCase();
  
  // Check for PDF file extension or content-type indicators
  return cleanUrl.endsWith('.pdf') ||
         cleanUrl.includes('pdf') ||
         cleanUrl.includes('drive.google.com') ||
         cleanUrl.includes('dropbox.com') ||
         cleanUrl.includes('onedrive.live.com') ||
         cleanUrl.includes('docs.google.com');
}

// Document URL validation helper (DOC, DOCX)
export function isDocumentUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const cleanUrl = url.trim().toLowerCase();
  
  // Check for document file extensions
  return cleanUrl.endsWith('.doc') ||
         cleanUrl.endsWith('.docx') ||
         cleanUrl.endsWith('.txt') ||
         cleanUrl.includes('docs.google.com') ||
         cleanUrl.includes('office.com') ||
         cleanUrl.includes('sharepoint.com');
}

// Generic file upload validation
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  
  // Check file type
  const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'File type not supported. Allowed: PDF, DOC, DOCX, TXT' };
  }
  
  return { valid: true };
}

// General document URL validation (PDF + DOC + DOCX)
export function isAnyDocumentUrl(url: string): boolean {
  return isPdfUrl(url) || isDocumentUrl(url);
}

// Parse Excel/XLSX files
export async function parseExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert array of arrays to array of objects
        if (jsonData.length < 2) {
          resolve([]);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const records = rows
          .filter(row => row.some(cell => cell !== undefined && cell !== ''))
          .map(row => {
            const record: any = {};
            headers.forEach((header, index) => {
              if (header) {
                record[header.toLowerCase().trim()] = row[index] || '';
              }
            });
            return record;
          });
        
        resolve(records);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
}

// Parse YAML files with support for complex syllabus structures
export async function parseYaml(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = yaml.load(content);
        
        // Handle different YAML structures
        if (Array.isArray(parsed)) {
          resolve(parsed);
        } else if (parsed && typeof parsed === 'object') {
          // Check for complex syllabus structure like combined_full_syllabus.yaml
          const courses = extractCoursesFromSyllabus(parsed);
          if (courses.length > 0) {
            resolve(courses);
          } else if ('courses' in parsed && Array.isArray(parsed.courses)) {
            resolve(parsed.courses);
          } else {
            // Convert single object to array
            resolve([parsed]);
          }
        } else {
          resolve([]);
        }
      } catch (error) {
        reject(new Error(`Failed to parse YAML file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read YAML file'));
    reader.readAsText(file, 'utf-8');
  });
}

// Extract courses from complex syllabus structure
function extractCoursesFromSyllabus(data: any): any[] {
  const courses: any[] = [];
  
  // Handle syllabus structure like the provided YAML
  const possibleCourseKeys = ['Full-Stack & DSA', 'English Communication', 'Design & AI Tools', 'Aptitude Prep'];
  
  for (const key of Object.keys(data)) {
    if (key === 'Overview') continue; // Skip overview section
    
    const courseData = data[key];
    if (Array.isArray(courseData)) {
      // This is a course with modules/weeks
      courseData.forEach((week, index) => {
        const module = {
          topic: week['Tech Topic'] || week['Topic'] || `${key} - Week ${week['Week'] || index + 1}`,
          youtubeLinks: extractYouTubeLinks(week),
          subtopics: extractSubtopics(week),
          tasks: extractTasks(week),
          description: extractDescription(week),
          week: week['Week'] || `${index + 1}`,
          course: key,
          duration: week['Duration'] || '1 week',
          difficulty: 'intermediate', // default
          metadata: {
            originalWeek: week,
            courseCategory: key,
            weekNumber: week['Week'] || index + 1
          }
        };
        courses.push(module);
      });
    }
  }
  
  return courses;
}

// Extract YouTube links from week/module data
function extractYouTubeLinks(weekData: any): string[] {
  const links: string[] = [];
  
  // Look for various link fields
  const linkFields = [
    'Hinglish Resource Link',
    'English Resource Link', 
    'Resource Link',
    'Video Link',
    'Youtube Link',
    'YouTube Link',
    'Video URL',
    'URL',
    'Link',
    'Watch',
    'Course Link',
    'Tutorial Link',
    'Learning Resource',
    'Reference Link',
    'Study Material',
    'Videos',
    'Resources',
    'Materials',
    'Content'
  ];
  
  // Extract from specific fields
  linkFields.forEach(field => {
    if (weekData[field]) {
      const value = weekData[field];
      if (typeof value === 'string') {
        const extractedLinks = extractAllLinksFromText(value);
        links.push(...extractedLinks.youtubeLinks);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string') {
            const extractedLinks = extractAllLinksFromText(item);
            links.push(...extractedLinks.youtubeLinks);
          }
        });
      }
    }
  });
  
  // Also check all string values in the week data for potential video links
  function recursiveExtractLinks(obj: any): void {
    if (typeof obj === 'string') {
      const extractedLinks = extractAllLinksFromText(obj);
      links.push(...extractedLinks.youtubeLinks);
    } else if (Array.isArray(obj)) {
      obj.forEach(item => recursiveExtractLinks(item));
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => recursiveExtractLinks(value));
    }
  }
  
  recursiveExtractLinks(weekData);
    return [...new Set(links)]; // Remove duplicates
}

// Extract subtopics from week data
function extractSubtopics(weekData: any): string[] {
  const subtopics: string[] = [];
  
  if (weekData['Subtopics']) {
    if (typeof weekData['Subtopics'] === 'string') {
      // Split by comma, semicolon, or pipe
      subtopics.push(...weekData['Subtopics'].split(/[,;|]/).map(s => s.trim()).filter(s => s));
    } else if (Array.isArray(weekData['Subtopics'])) {
      subtopics.push(...weekData['Subtopics'].map(s => String(s).trim()).filter(s => s));
    }
  }
  
  return subtopics;
}

// Extract tasks from week data
function extractTasks(weekData: any): string[] {
  const tasks: string[] = [];
  
  if (weekData['Practice Task']) {
    if (typeof weekData['Practice Task'] === 'string') {
      tasks.push(weekData['Practice Task'].trim());
    } else if (Array.isArray(weekData['Practice Task'])) {
      tasks.push(...weekData['Practice Task'].map(t => String(t).trim()).filter(t => t));
    }
  }
  
  // Also check for other task fields
  const taskFields = ['Task', 'Assignment', 'Exercise', 'Project'];
  for (const field of taskFields) {
    if (weekData[field] && typeof weekData[field] === 'string') {
      tasks.push(weekData[field].trim());
    }
  }
  
  return tasks;
}

// Extract description from week data
function extractDescription(weekData: any): string {
  // Try to build a description from available fields
  const parts: string[] = [];
  
  if (weekData['Topic']) {
    parts.push(`Topic: ${weekData['Topic']}`);
  }
  
  if (weekData['Subtopics']) {
    parts.push(`Subtopics: ${weekData['Subtopics']}`);
  }
  
  if (weekData['Hinglish Creator']) {
    parts.push(`Hinglish Creator: ${weekData['Hinglish Creator']}`);
  }
  
  if (weekData['English Creator']) {
    parts.push(`English Creator: ${weekData['English Creator']}`);
  }
  
  return parts.join(' | ') || 'Course module from imported syllabus';
}

// Parse TXT files with structured format
export async function parseTxt(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Use the enhanced link extraction on the entire content first
        const extractedLinks = extractAllLinksFromText(content);
        
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        const records: any[] = [];
        let currentRecord: any = null;
        
        for (const line of lines) {
          // Skip empty lines and comments
          if (!line || line.startsWith('#') || line.startsWith('//')) continue;
          
          // Course/Topic line - more flexible matching
          if (line.match(/^(Course|Topic|Title|Subject|Module|Lesson|Chapter|Week)[\s\d]*:/i) ||
              line.match(/^(Module|Lesson|Chapter|Week)\s*\d+/i) ||
              line.match(/^##?\s+/)) {
                
            // Save previous record
            if (currentRecord) {
              // Add extracted links to the current record
              addExtractedLinksToRecord(currentRecord, extractedLinks);
              records.push(currentRecord);
            }
            
            // Create new record
            currentRecord = {
              topic: line.replace(/^(Course|Topic|Title|Subject|Module|Lesson|Chapter|Week)[\s\d]*:/i, '')
                        .replace(/^(Module|Lesson|Chapter|Week)\s*\d+[\s:]*/i, '')
                        .replace(/^##?\s+/, '')
                        .trim(),
              youtubeLinks: [],
              pdfLinks: [],
              docLinks: [],
              subtopics: [],
              tasks: [],
              metadata: {}
            };
          }
          // Description line
          else if (line.match(/^(Description|About|Summary):/i) && currentRecord) {
            currentRecord.description = line.replace(/^(Description|About|Summary):/i, '').trim();
          }
          // Week line
          else if (line.match(/^Week:/i) && currentRecord) {
            currentRecord.week = line.replace(/^Week:/i, '').trim();
          }
          // Duration line
          else if (line.match(/^(Duration|Time|Length):/i) && currentRecord) {
            currentRecord.duration = line.replace(/^(Duration|Time|Length):/i, '').trim();
          }
          // Difficulty line
          else if (line.match(/^(Difficulty|Level):/i) && currentRecord) {
            currentRecord.difficulty = line.replace(/^(Difficulty|Level):/i, '').trim();
          }
          // YouTube URLs line - more flexible matching
          else if (line.match(/^(YouTube|URLs?|Links?|Videos?|Resources?):/i)) {
            if (currentRecord) {
              const urls = line.replace(/^(YouTube|URLs?|Links?|Videos?|Resources?):/i, '').trim()
                .split(/[,;\n|]/).map(url => url.trim()).filter(url => url);
              
              // Use enhanced link extraction on this line specifically
              const lineLinks = extractAllLinksFromText(line);
              currentRecord.youtubeLinks.push(...lineLinks.youtubeLinks);
              currentRecord.pdfLinks.push(...lineLinks.pdfLinks);
              currentRecord.docLinks.push(...lineLinks.docLinks);
              
              // Also process URLs with our enhanced logic
              urls.forEach(url => {
                if (isYouTubeUrl(url) || url.includes('vimeo') || url.includes('twitch')) {
                  currentRecord.youtubeLinks.push(url);
                } else if (isPdfUrl(url)) {
                  currentRecord.pdfLinks.push(url);
                } else if (isDocumentUrl(url)) {
                  currentRecord.docLinks.push(url);
                }
              });
            }
          }
          // PDF URLs line
          else if (line.match(/^(PDF|Documents?|Docs?|Materials?|Files?):/i)) {
            if (currentRecord) {
              const lineLinks = extractAllLinksFromText(line);
              currentRecord.pdfLinks.push(...lineLinks.pdfLinks);
              currentRecord.docLinks.push(...lineLinks.docLinks);
            }
          }
          // Subtopics line
          else if (line.match(/^(Subtopics|Topics|Covers):/i) && currentRecord) {
            const subtopics = line.replace(/^(Subtopics|Topics|Covers):/i, '').trim()
              .split(/[,;\n|]/).map(s => s.trim()).filter(s => s);
            currentRecord.subtopics.push(...subtopics);
          }
          // Tasks line
          else if (line.match(/^(Tasks?|Exercises?|Assignments?|Practice):/i) && currentRecord) {
            const tasks = line.replace(/^(Tasks?|Exercises?|Assignments?|Practice):/i, '').trim()
              .split(/[,;\n|]/).map(t => t.trim()).filter(t => t);
            currentRecord.tasks.push(...tasks);
          }
          // Handle bullets and numbered lists as subtopics
          else if (line.match(/^[-*•]\s+/) && currentRecord) {
            const subtopic = line.replace(/^[-*•]\s+/, '').trim();
            if (subtopic) {
              currentRecord.subtopics.push(subtopic);
            }
          }
          else if (line.match(/^\d+\.\s+/) && currentRecord) {
            const subtopic = line.replace(/^\d+\.\s+/, '').trim();
            if (subtopic) {
              currentRecord.subtopics.push(subtopic);
            }
          }
          // Handle direct URLs found in lines
          else if (line.match(/https?:\/\//)) {
            if (currentRecord) {
              const lineLinks = extractAllLinksFromText(line);
              currentRecord.youtubeLinks.push(...lineLinks.youtubeLinks);
              currentRecord.pdfLinks.push(...lineLinks.pdfLinks);
              currentRecord.docLinks.push(...lineLinks.docLinks);
            }
          }
          // CSV format detection (comma-separated values)
          else if (line.includes(',') && !currentRecord) {
            // Try to parse as CSV-like format
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 1 && parts[0]) {
              const newRecord: any = {
                topic: parts[0],
                youtubeLinks: [],
                pdfLinks: [],
                docLinks: [],
                subtopics: [],
                tasks: [],
                metadata: {}
              };
              
              // Extract links from all parts
              const restOfLine = parts.slice(1).join(' ');
              const lineLinks = extractAllLinksFromText(restOfLine);
              newRecord.youtubeLinks.push(...lineLinks.youtubeLinks);
              newRecord.pdfLinks.push(...lineLinks.pdfLinks);
              newRecord.docLinks.push(...lineLinks.docLinks);
              
              // Look for description in non-URL parts
              const nonUrls = parts.slice(1).filter(part => 
                part && !part.includes('http') && part.length > 5
              );
              if (nonUrls.length > 0) {
                newRecord.description = nonUrls[0];
              }
              
              records.push(newRecord);
            }
          }
          // If we have a current record and this looks like content, add it as description
          else if (currentRecord && !currentRecord.description && line.length > 10 && !line.includes(':')) {
            currentRecord.description = line;
          }
        }
        
        // Add the last record
        if (currentRecord) {
          addExtractedLinksToRecord(currentRecord, extractedLinks);
          records.push(currentRecord);
        }
        
        // If no structured records found, try to parse as simple list or extract all links
        if (records.length === 0 && lines.length > 0) {
          // If we found links but no structured content, create a general record
          if (extractedLinks.youtubeLinks.length > 0 || extractedLinks.pdfLinks.length > 0 || extractedLinks.docLinks.length > 0) {
            records.push({
              topic: 'Extracted Resources',
              youtubeLinks: extractedLinks.youtubeLinks,
              pdfLinks: extractedLinks.pdfLinks,
              docLinks: extractedLinks.docLinks,
              description: 'Resources extracted from document',
              metadata: { source: 'bulk-extraction' }
            });
          } else {
            // Try to treat each line as a topic
            for (const line of lines) {
              if (line.length > 2) { // Minimum topic length
                records.push({
                  topic: line,
                  youtubeLinks: [],
                  pdfLinks: [],
                  docLinks: [],
                  subtopics: [],
                  tasks: [],
                  metadata: { source: 'simple-list' }
                });
              }
            }
          }
        }
        
        // Deduplicate links in each record
        records.forEach(record => {
          record.youtubeLinks = [...new Set(record.youtubeLinks)];
          record.pdfLinks = [...new Set(record.pdfLinks)];
          record.docLinks = [...new Set(record.docLinks)];
          record.subtopics = [...new Set(record.subtopics)];
          record.tasks = [...new Set(record.tasks)];
        });
        
        resolve(records);
      } catch (error) {
        reject(new Error(`Failed to parse TXT file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read TXT file'));
    reader.readAsText(file, 'utf-8');
  });
}

// Helper function to add extracted links to a record
function addExtractedLinksToRecord(record: any, extractedLinks: any) {
  // Only add a portion of extracted links to avoid overwhelming any single record
  const maxLinksPerRecord = 10;
  
  if (extractedLinks.youtubeLinks.length > 0) {
    record.youtubeLinks.push(...extractedLinks.youtubeLinks.slice(0, maxLinksPerRecord));
  }
  if (extractedLinks.pdfLinks.length > 0) {
    record.pdfLinks.push(...extractedLinks.pdfLinks.slice(0, maxLinksPerRecord));
  }
  if (extractedLinks.docLinks.length > 0) {
    record.docLinks.push(...extractedLinks.docLinks.slice(0, maxLinksPerRecord));
  }
}

// Normalize parsed data to CourseImportPreview format
export function normalizeImportData(data: any): CourseImportPreview {
  const normalized: CourseImportPreview = {
    topic: '',
    youtubeLinks: [],
    pdfLinks: [],
    docLinks: [],
    uploadedDocuments: [],
    metadata: {},
  };

  // Handle different possible field names for topic
  const topicFields = ['topic', 'title', 'course', 'name', 'subject', 'lesson', 'module', 'Tech Topic', 'Topic'];
  for (const field of topicFields) {
    if (data[field] && typeof data[field] === 'string' && data[field].trim()) {
      normalized.topic = data[field].trim();
      break;
    }
  }

  // If no topic found, try to use first non-empty string value
  if (!normalized.topic) {
    const firstStringValue = Object.values(data).find(value => 
      typeof value === 'string' && value.trim() && value.length > 2
    ) as string;
    if (firstStringValue) {
      normalized.topic = firstStringValue.trim();
    }
  }

  // Handle YouTube links with enhanced flexibility for syllabus structure
  if (data.youtubeLinks && Array.isArray(data.youtubeLinks)) {    normalized.youtubeLinks = data.youtubeLinks.filter((link: any) => 
      typeof link === 'string' && link.trim()
    );
  } else {
    // Check various fields for YouTube links
    const linkFields = [
      'youtubelinks', 'youtube', 'urls', 'links', 'videos', 'url', 'video',
      'Hinglish Resource Link', 'English Resource Link', 'Resource Link'
    ];
    
    for (const field of linkFields) {
      if (data[field]) {
        let links: string[] = [];
        
        if (typeof data[field] === 'string') {
          // Split by various separators
          links = data[field].split(/[,;\n|\t]/).map(link => link.trim()).filter(link => link);
        } else if (Array.isArray(data[field])) {
          links = data[field].map(link => String(link).trim()).filter(link => link);
        }
        
        // Be more lenient with URL validation - include potential YouTube URLs
        const potentialYouTubeLinks = links.filter(link => {
          const cleanLink = link.trim();
          return cleanLink && (
            isYouTubeUrl(cleanLink) || 
            cleanLink.includes('youtube') || 
            cleanLink.includes('youtu.be') ||
            cleanLink.startsWith('http') // Include other HTTP links for now
          );
        });
        
        if (potentialYouTubeLinks.length > 0) {
          normalized.youtubeLinks.push(...potentialYouTubeLinks);
        }
      }
    }
  }

  // Handle enhanced fields for syllabus structure
  const enhancedFields = {
    subtopics: ['subtopics', 'Subtopics', 'sub_topics', 'sub-topics'],
    tasks: ['tasks', 'Practice Task', 'Task', 'Assignment', 'Exercise', 'Project'],
    description: ['description', 'desc', 'details', 'about', 'summary'],
    week: ['week', 'Week', 'module', 'Module', 'lesson', 'Lesson'],
    duration: ['duration', 'Duration', 'time', 'length'],
    difficulty: ['difficulty', 'Difficulty', 'level', 'Level'],
    course: ['course', 'Course', 'category', 'Category']
  };

  for (const [normalizedField, possibleFields] of Object.entries(enhancedFields)) {
    for (const field of possibleFields) {
      if (data[field]) {
        if (normalizedField === 'subtopics' || normalizedField === 'tasks') {
          // Handle arrays or comma-separated strings
          if (Array.isArray(data[field])) {
            (normalized as any)[normalizedField] = data[field].map(item => String(item).trim()).filter(item => item);
          } else if (typeof data[field] === 'string') {
            (normalized as any)[normalizedField] = data[field].split(/[,;|]/).map(item => item.trim()).filter(item => item);
          }
        } else {
          // Handle single values
          (normalized as any)[normalizedField] = String(data[field]).trim();
        }
        break;
      }
    }
  }
  // Handle PDF and document links extraction
  const documentLinkFields = [
    'pdflinks', 'pdf', 'pdfs', 'documents', 'docs', 'materials', 'resources',
    'pdfLink', 'pdfUrl', 'documentLink', 'documentUrl', 'materialLink',
    'PDF Link', 'Document Link', 'Material Link', 'Resource PDF'
  ];
  
  for (const field of documentLinkFields) {
    if (data[field]) {
      let links: string[] = [];
      
      if (typeof data[field] === 'string') {
        // Split by various separators
        links = data[field].split(/[,;\n|\t]/).map(link => link.trim()).filter(link => link);
      } else if (Array.isArray(data[field])) {
        links = data[field].map(link => String(link).trim()).filter(link => link);
      }
      
      // Separate PDF and DOC links
      links.forEach(link => {
        const cleanLink = link.trim();
        if (cleanLink) {
          if (isPdfUrl(cleanLink)) {
            normalized.pdfLinks.push(cleanLink);
          } else if (isDocumentUrl(cleanLink)) {
            normalized.docLinks.push(cleanLink);
          } else if (isAnyDocumentUrl(cleanLink)) {
            // If it's a general document URL, add to docLinks
            normalized.docLinks.push(cleanLink);
          }
        }
      });
    }
  }

  // Also check YouTube link fields for any document links that might be mixed in
  const allLinkFields = [
    'links', 'urls', 'resources', 'materials', 'attachments',
    'Link', 'URL', 'Resource', 'Material', 'Attachment'
  ];
  
  for (const field of allLinkFields) {
    if (data[field]) {
      let links: string[] = [];
      
      if (typeof data[field] === 'string') {
        links = data[field].split(/[,;\n|\t]/).map(link => link.trim()).filter(link => link);
      } else if (Array.isArray(data[field])) {
        links = data[field].map(link => String(link).trim()).filter(link => link);
      }
      
      links.forEach(link => {
        const cleanLink = link.trim();
        if (cleanLink) {
          if (isYouTubeUrl(cleanLink) || cleanLink.includes('youtube') || cleanLink.includes('youtu.be')) {
            // Add to YouTube links if not already present
            if (!normalized.youtubeLinks.includes(cleanLink)) {
              normalized.youtubeLinks.push(cleanLink);
            }
          } else if (isPdfUrl(cleanLink)) {
            // Add to PDF links if not already present
            if (!normalized.pdfLinks.includes(cleanLink)) {
              normalized.pdfLinks.push(cleanLink);
            }
          } else if (isDocumentUrl(cleanLink)) {
            // Add to document links if not already present
            if (!normalized.docLinks.includes(cleanLink)) {
              normalized.docLinks.push(cleanLink);
            }
          }
        }
      });
    }
  }

  // Store all original fields in metadata for reference
  const processedFields = new Set([
    'topic', 'title', 'course', 'name', 'subject', 'lesson', 'module', 'tech topic',
    'youtubelinks', 'youtube', 'urls', 'links', 'videos', 'url', 'video',
    'hinglish resource link', 'english resource link', 'resource link',
    'subtopics', 'practice task', 'task', 'assignment', 'exercise', 'project',
    'week', 'duration', 'difficulty', 'description'
  ]);

  // Store all fields in metadata, preserving original structure
  normalized.metadata = {
    ...data,
    importedAt: new Date().toISOString(),
    originalStructure: JSON.parse(JSON.stringify(data))
  };

  // Clean up metadata by removing processed fields (case-insensitive)
  Object.keys(normalized.metadata).forEach(key => {
    if (processedFields.has(key.toLowerCase())) {
      delete normalized.metadata[key];
    }
  });

  return normalized;
}

// Validate import preview with strict mandatory field validation
export function validateImportPreview(preview: CourseImportPreview): CourseImportPreview {
  const errors: string[] = [];

  // 1. MANDATORY: Topic validation
  if (!preview.topic || preview.topic.trim() === '') {
    errors.push('❌ TOPIC IS MANDATORY: Every course entry must have a topic/course name');
  } else if (preview.topic.trim().length < 3) {
    errors.push('❌ TOPIC TOO SHORT: Topic/course name must be at least 3 characters long');
  }

  // 2. MANDATORY: At least one of YouTube links OR document links (PDF/DOC)
  const hasValidYouTubeLinks = preview.youtubeLinks && preview.youtubeLinks.length > 0 && 
    preview.youtubeLinks.some(url => {
      const cleanUrl = url?.trim();
      return cleanUrl && isYouTubeUrl(cleanUrl);
    });

  const hasValidDocLinks = (preview.pdfLinks && preview.pdfLinks.length > 0 && 
    preview.pdfLinks.some(url => {
      const cleanUrl = url?.trim();
      return cleanUrl && isPdfUrl(cleanUrl);
    })) || 
    (preview.docLinks && preview.docLinks.length > 0 && 
    preview.docLinks.some(url => {
      const cleanUrl = url?.trim();
      return cleanUrl && isDocumentUrl(cleanUrl);
    })) ||
    (preview.uploadedDocuments && preview.uploadedDocuments.length > 0);

  if (!hasValidYouTubeLinks && !hasValidDocLinks) {
    errors.push('❌ CONTENT LINKS ARE MANDATORY: Each course entry must have at least one valid YouTube video link OR at least one valid document link (PDF/DOC). You can provide either video content or document content, but at least one is required.');
  }

  // Validate YouTube links if present (show specific errors for invalid links)
  if (preview.youtubeLinks && preview.youtubeLinks.length > 0) {
    const invalidYouTubeUrls = preview.youtubeLinks.filter(url => {
      const cleanUrl = url?.trim();
      return !cleanUrl || !isYouTubeUrl(cleanUrl);
    });
    
    if (invalidYouTubeUrls.length > 0) {
      errors.push(`❌ INVALID YOUTUBE LINKS: Found ${invalidYouTubeUrls.length} invalid YouTube URLs. Please check these links: ${invalidYouTubeUrls.slice(0, 2).join(', ')}${invalidYouTubeUrls.length > 2 ? '...' : ''}`);
    }
  }

  // Validate PDF links if present
  if (preview.pdfLinks && preview.pdfLinks.length > 0) {
    const invalidPdfUrls = preview.pdfLinks.filter(url => {
      const cleanUrl = url?.trim();
      return !cleanUrl || !isPdfUrl(cleanUrl);
    });
    
    if (invalidPdfUrls.length > 0) {
      errors.push(`❌ INVALID PDF LINKS: Found ${invalidPdfUrls.length} invalid PDF URLs. Please check these links: ${invalidPdfUrls.slice(0, 2).join(', ')}${invalidPdfUrls.length > 2 ? '...' : ''}`);
    }
  }

  // Validate DOC links if present
  if (preview.docLinks && preview.docLinks.length > 0) {
    const invalidDocUrls = preview.docLinks.filter(url => {
      const cleanUrl = url?.trim();
      return !cleanUrl || !isDocumentUrl(cleanUrl);
    });
    
    if (invalidDocUrls.length > 0) {
      errors.push(`❌ INVALID DOCUMENT LINKS: Found ${invalidDocUrls.length} invalid DOC URLs. Please check these links: ${invalidDocUrls.slice(0, 2).join(', ')}${invalidDocUrls.length > 2 ? '...' : ''}`);
    }
  }

  // Optional field notifications (not errors - just helpful info)
  const notifications: string[] = [];
  
  if (!preview.subtopics || preview.subtopics.length === 0) {
    notifications.push('ℹ️ OPTIONAL: Consider adding subtopics for better course organization');
  }
  
  if (!preview.tasks || preview.tasks.length === 0) {
    notifications.push('ℹ️ OPTIONAL: Consider adding practice tasks for better learning outcomes');
  }
  
  if (!preview.description || preview.description.trim() === '') {
    notifications.push('ℹ️ OPTIONAL: Consider adding a description for better course understanding');
  }

  if (!preview.duration || preview.duration.trim() === '') {
    notifications.push('ℹ️ OPTIONAL: Consider adding duration information');
  }

  // Add notifications to metadata (for UI display, not as validation errors)
  if (notifications.length > 0) {
    preview.metadata.notifications = notifications;
  }

  // Add summary of what's required vs optional
  preview.metadata.validationInfo = {
    required: ['Topic (course name)', 'At least one YouTube video link OR one document link (PDF/DOC)'],
    optional: ['Subtopics', 'Practice tasks', 'Description', 'Duration', 'Week number', 'Difficulty level'],
    note: 'You must provide either video content (YouTube) OR document content (PDF/DOC), but not necessarily both.'
  };

  // Set error if any mandatory validation failed
  if (errors.length > 0) {
    preview.error = errors.join(' | ');
  }

  return preview;
}

// Main import function
export async function importCourseFile(file: File): Promise<CourseImportPreview[]> {
  try {
    const fileName = file.name.toLowerCase();
    let rawData: any[] = [];    // Detect file type and parse accordingly
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      rawData = await parseYaml(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      rawData = await parseExcel(file);
    } else if (fileName.endsWith('.txt')) {
      rawData = await parseTxt(file);
    } else if (fileName.endsWith('.csv')) {
      // Handle CSV using the TXT parser with CSV detection
      rawData = await parseTxt(file);
    } else if (fileName.endsWith('.json')) {
      // Handle JSON files
      rawData = await parseJson(file);
    } else if (fileName.endsWith('.md')) {
      // Handle Markdown files
      rawData = await parseMarkdown(file);
    } else {
      throw new Error(`Unsupported file format. Supported formats: YAML, Excel (XLSX/XLS), TXT, CSV, JSON, Markdown (MD)`);
    }

    // Normalize and validate data
    const previews = rawData.map(item => {
      const normalized = normalizeImportData(item);
      return validateImportPreview(normalized);
    });

    return previews;
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validation summary helper
export function getImportValidationSummary(previews: CourseImportPreview[]): ImportValidationResult {
  const valid = previews.filter(p => !p.error);
  const invalid = previews.filter(p => p.error);
  
  const errors = invalid.map(p => p.error!);

  return {
    valid,
    invalid,
    summary: {
      total: previews.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      errors
    }
  };
}

// Parse pasted text content (YAML, JSON, or structured text)
export async function parseTextContent(content: string): Promise<any[]> {
  try {
    // First, try to parse as YAML
    try {
      const parsed = yaml.load(content);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Check for complex syllabus structure
        const courses = extractCoursesFromSyllabus(parsed);
        if (courses.length > 0) {
          return courses;
        } else if ('courses' in parsed && Array.isArray(parsed.courses)) {
          return parsed.courses;
        } else {
          return [parsed];
        }
      }
    } catch (yamlError) {
      // If YAML parsing fails, try JSON
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (jsonError) {
        // If both fail, try to parse as structured text
        return parseStructuredText(content);
      }
    }
    
    return [];
  } catch (error) {
    throw new Error(`Failed to parse text content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Parse structured text format
function parseStructuredText(content: string): any[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const records: any[] = [];
  let currentRecord: any = null;
  
  for (const line of lines) {
    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    
    // Detect new course/topic entry
    if (line.toLowerCase().includes('topic:') || 
        line.toLowerCase().includes('course:') || 
        line.toLowerCase().includes('title:') ||
        line.match(/^(week|module|lesson)\s*\d+/i)) {
      
      // Save previous record
      if (currentRecord && currentRecord.topic) {
        records.push(currentRecord);
      }
      
      // Start new record
      currentRecord = {
        topic: extractTopicFromLine(line),
        youtubeLinks: [],
        pdfLinks: [],
        docLinks: [],
        subtopics: [],
        tasks: [],
        metadata: {}
      };
    }
    
    // Extract content from current line
    if (currentRecord) {
      extractContentFromLine(line, currentRecord);
    }
  }
  
  // Add last record
  if (currentRecord && currentRecord.topic) {
    records.push(currentRecord);
  }
  
  return records;
}

// Extract topic from a line
function extractTopicFromLine(line: string): string {
  // Remove common prefixes and extract topic
  const cleanLine = line
    .replace(/^(topic|course|title|week|module|lesson)\s*:?\s*/i, '')
    .replace(/^(week|module|lesson)\s*\d+\s*:?\s*/i, '')
    .trim();
  
  return cleanLine || '';
}

// Extract various content types from a line
function extractContentFromLine(line: string, record: any): void {
  const lowerLine = line.toLowerCase();
  
  // Extract YouTube links
  const youtubeMatches = line.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/g);
  if (youtubeMatches) {
    record.youtubeLinks.push(...youtubeMatches);
  }
  
  // Extract PDF links
  const pdfMatches = line.match(/https?:\/\/[^\s]+\.pdf/g);
  if (pdfMatches) {
    record.pdfLinks.push(...pdfMatches);
  }
  
  // Extract DOC links
  const docMatches = line.match(/https?:\/\/[^\s]+\.docx?/g);
  if (docMatches) {
    record.docLinks.push(...docMatches);
  }
  
  // Extract subtopics
  if (lowerLine.includes('subtopic') || lowerLine.includes('topics') || lowerLine.includes('covers')) {
    const subtopicsText = line.replace(/^[^:]*:?\s*/i, '').trim();
    if (subtopicsText) {
      const subtopics = subtopicsText.split(/[,;|]/).map(s => s.trim()).filter(s => s);
      record.subtopics.push(...subtopics);
    }
  }
  
  // Extract tasks
  if (lowerLine.includes('task') || lowerLine.includes('exercise') || lowerLine.includes('assignment') || lowerLine.includes('practice')) {
    const taskText = line.replace(/^[^:]*:?\s*/i, '').trim();
    if (taskText) {
      record.tasks.push(taskText);
    }
  }
  
  // Extract other metadata
  if (lowerLine.includes('duration') || lowerLine.includes('time')) {
    const duration = line.replace(/^[^:]*:?\s*/i, '').trim();
    if (duration) record.duration = duration;
  }
  
  if (lowerLine.includes('difficulty') || lowerLine.includes('level')) {
    const difficulty = line.replace(/^[^:]*:?\s*/i, '').trim();
    if (difficulty) record.difficulty = difficulty;
  }
  
  if (lowerLine.includes('description') || lowerLine.includes('about')) {
    const description = line.replace(/^[^:]*:?\s*/i, '').trim();
    if (description) record.description = description;
  }
}

// Extract all links from text content with enhanced detection
export function extractAllLinksFromText(content: string): {
  youtubeLinks: string[];
  pdfLinks: string[];
  docLinks: string[];
  otherLinks: string[];
} {
  // Extremely comprehensive YouTube regex patterns
  const youtubePatterns = [
    // Standard YouTube URLs with all possible parameters
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+(?:&[\w=&.-]*)?/g,
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+(?:\?[\w=&.-]*)?/g,
    /https?:\/\/youtu\.be\/[\w-]+(?:\?[\w=&.-]*)?/g,
    
    // YouTube playlists (all variations)
    /https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=[\w-]+(?:&[\w=&.-]*)?/g,
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+&list=[\w-]+(?:&[\w=&.-]*)?/g,
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?list=[\w-]+(?:&[\w=&.-]*)?/g,
    
    // YouTube channel URLs
    /https?:\/\/(?:www\.)?youtube\.com\/channel\/[\w-]+(?:\/[\w?=&.-]*)?/g,
    /https?:\/\/(?:www\.)?youtube\.com\/c\/[\w-]+(?:\/[\w?=&.-]*)?/g,
    /https?:\/\/(?:www\.)?youtube\.com\/@[\w.-]+(?:\/[\w?=&.-]*)?/g,
    /https?:\/\/(?:www\.)?youtube\.com\/user\/[\w-]+(?:\/[\w?=&.-]*)?/g,
    
    // YouTube mobile and app URLs
    /https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+(?:&[\w=&.-]*)?/g,
    /https?:\/\/gaming\.youtube\.com\/watch\?v=[\w-]+(?:&[\w=&.-]*)?/g,
    
    // YouTube shorts and live
    /https?:\/\/(?:www\.)?youtube\.com\/shorts\/[\w-]+(?:\?[\w=&.-]*)?/g,
    /https?:\/\/(?:www\.)?youtube\.com\/live\/[\w-]+(?:\?[\w=&.-]*)?/g,
    
    // YouTube TV and music
    /https?:\/\/tv\.youtube\.com\/watch\?v=[\w-]+(?:&[\w=&.-]*)?/g,
    /https?:\/\/music\.youtube\.com\/watch\?v=[\w-]+(?:&[\w=&.-]*)?/g,
    
    // Other video platforms (comprehensive)
    /https?:\/\/(?:www\.)?vimeo\.com\/[\w-]+(?:\/[\w?=&.-]*)?/g,
    /https?:\/\/(?:www\.)?dailymotion\.com\/video\/[\w-]+(?:\?[\w=&.-]*)?/g,
    /https?:\/\/(?:www\.)?twitch\.tv\/videos\/[\w-]+(?:\?[\w=&.-]*)?/g,
    /https?:\/\/(?:www\.)?twitch\.tv\/[\w-]+/g,
    /https?:\/\/(?:www\.)?facebook\.com\/watch\/?\?v=[\w-]+/g,
    /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[\w-]+/g,
    /https?:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/[\w-]+/g,
    /https?:\/\/(?:www\.)?linkedin\.com\/posts\/[\w-]+/g,
    /https?:\/\/(?:www\.)?wistia\.com\/medias\/[\w-]+/g,
    /https?:\/\/(?:www\.)?brightcove\.com\/[\w\/-]+/g,
    
    // Educational video platforms
    /https?:\/\/(?:www\.)?coursera\.org\/learn\/[\w-]+/g,
    /https?:\/\/(?:www\.)?udemy\.com\/course\/[\w-]+/g,
    /https?:\/\/(?:www\.)?edx\.org\/course\/[\w-]+/g,
    /https?:\/\/(?:www\.)?khanacademy\.org\/[\w\/-]+/g,
    /https?:\/\/(?:www\.)?pluralsight\.com\/courses\/[\w-]+/g,
    /https?:\/\/(?:www\.)?lynda\.com\/[\w\/-]+/g,
    /https?:\/\/(?:www\.)?skillshare\.com\/classes\/[\w\/-]+/g,
    /https?:\/\/(?:www\.)?udacity\.com\/course\/[\w-]+/g,
    
    // Code learning platforms with videos
    /https?:\/\/(?:www\.)?freecodecamp\.org\/[\w\/-]+/g,
    /https?:\/\/(?:www\.)?codecademy\.com\/[\w\/-]+/g,
    /https?:\/\/(?:www\.)?codewithmosh\.com\/[\w\/-]+/g,
    
    // Live streaming and webinar platforms
    /https?:\/\/(?:www\.)?zoom\.us\/j\/[\w-]+/g,
    /https?:\/\/(?:www\.)?webex\.com\/[\w\/-]+/g,
    /https?:\/\/(?:www\.)?meet\.google\.com\/[\w-]+/g,
    /https?:\/\/(?:www\.)?gotomeeting\.com\/[\w\/-]+/g,
    
    // Video hosting and sharing
    /https?:\/\/(?:www\.)?dropbox\.com\/s\/[\w]+\/.*\.(?:mp4|avi|mov|wmv|flv|webm|mkv)/g,
    /https?:\/\/drive\.google\.com\/file\/d\/[\w-]+\/.*(?:mp4|avi|mov|wmv|flv|webm|mkv)/g,
    /https?:\/\/onedrive\.live\.com\/[\w\/?=&.-]*\.(?:mp4|avi|mov|wmv|flv|webm|mkv)/g,
    
    // Direct video file links
    /https?:\/\/[^\s]+\.(?:mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|ogv)(?:\?[^\s]*)?/g,
    
    // Embedded video players and CDNs
    /https?:\/\/player\.vimeo\.com\/video\/[\w-]+/g,
    /https?:\/\/fast\.wistia\.net\/embed\/iframe\/[\w-]+/g,
    /https?:\/\/videopress\.com\/v\/[\w-]+/g,
    
    // Regional YouTube domains
    /https?:\/\/(?:www\.)?youtube\.co\.uk\/watch\?v=[\w-]+/g,
    /https?:\/\/(?:www\.)?youtube\.ca\/watch\?v=[\w-]+/g,
    /https?:\/\/(?:www\.)?youtube\.de\/watch\?v=[\w-]+/g,
    /https?:\/\/(?:www\.)?youtube\.fr\/watch\?v=[\w-]+/g,
    /https?:\/\/(?:www\.)?youtube\.in\/watch\?v=[\w-]+/g,
    /https?:\/\/(?:www\.)?youtube\.com\.au\/watch\?v=[\w-]+/g,
  ];

  // Enhanced document patterns
  const documentPatterns = [
    // PDF documents (all variations)
    /https?:\/\/[^\s]+\.pdf(?:\?[^\s]*)?/g,
    /https?:\/\/[^\s]*\.pdf[^\s]*/g,
    
    // Office documents (comprehensive)
    /https?:\/\/[^\s]+\.(?:doc|docx|ppt|pptx|xls|xlsx|odt|odp|ods)(?:\?[^\s]*)?/g,
    
    // Google Drive and Docs (all types)
    /https?:\/\/drive\.google\.com\/file\/d\/[^\s\/]+\/[^\s]*?/g,
    /https?:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation|forms|drawings)\/d\/[^\s\/]+\/[^\s]*?/g,
    /https?:\/\/drive\.google\.com\/open\?id=[\w-]+/g,
    /https?:\/\/drive\.google\.com\/drive\/folders\/[\w-]+/g,
    
    // GitHub repositories and files (comprehensive)
    /https?:\/\/github\.com\/[^\s\/]+\/[^\s\/]+(?:\/[^\s]*)?/g,
    /https?:\/\/raw\.githubusercontent\.com\/[^\s]+/g,
    /https?:\/\/gist\.github\.com\/[^\s\/]+\/[\w-]+/g,
    /https?:\/\/github\.io\/[^\s]*/g,
    
    // GitLab and other Git platforms
    /https?:\/\/gitlab\.com\/[^\s\/]+\/[^\s\/]+(?:\/[^\s]*)?/g,
    /https?:\/\/bitbucket\.org\/[^\s\/]+\/[^\s\/]+(?:\/[^\s]*)?/g,
    
    // Documentation sites (comprehensive)
    /https?:\/\/[^\s]*(?:docs|documentation|wiki|readme|manual|guide)[^\s]*/g,
    /https?:\/\/[^\s]*\.(?:readthedocs\.io|gitbook\.io|gitbook\.com)[^\s]*/g,
    
    // Cloud storage platforms
    /https?:\/\/[^\s]*\.dropbox\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.box\.com\/[^\s]*/g,
    /https?:\/\/onedrive\.live\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.sharepoint\.com\/[^\s]*/g,
    
    // Note-taking and knowledge platforms
    /https?:\/\/[^\s]*\.notion\.so\/[^\s]*/g,
    /https?:\/\/[^\s]*\.atlassian\.net\/[^\s]*/g,
    /https?:\/\/[^\s]*\.confluence\.[^\s]*/g,
    /https?:\/\/[^\s]*\.obsidian\.md\/[^\s]*/g,
    
    // Academic and research platforms
    /https?:\/\/[^\s]*\.academia\.edu\/[^\s]*/g,
    /https?:\/\/[^\s]*\.researchgate\.net\/[^\s]*/g,
    /https?:\/\/arxiv\.org\/[^\s]*/g,
    /https?:\/\/[^\s]*\.jstor\.org\/[^\s]*/g,
    
    // Blogging and content platforms
    /https?:\/\/[^\s]*medium\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.substack\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.wordpress\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.blogger\.com\/[^\s]*/g,
    
    // Programming and technical resources
    /https?:\/\/stackoverflow\.com\/[^\s]*/g,
    /https?:\/\/stackexchange\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.stackexchange\.com\/[^\s]*/g,
    /https?:\/\/dev\.to\/[^\s]*/g,
    /https?:\/\/[^\s]*\.hashnode\.[^\s]*/g,
    
    // Learning management systems
    /https?:\/\/[^\s]*\.canvas\.[^\s]*/g,
    /https?:\/\/[^\s]*\.blackboard\.[^\s]*/g,
    /https?:\/\/[^\s]*\.moodle\.[^\s]*/g,
    
    // Presentation platforms
    /https?:\/\/[^\s]*\.slideshare\.net\/[^\s]*/g,
    /https?:\/\/[^\s]*\.prezi\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.canva\.com\/[^\s]*/g,
    
    // File hosting and sharing
    /https?:\/\/[^\s]*\.mediafire\.com\/[^\s]*/g,
    /https?:\/\/[^\s]*\.mega\.nz\/[^\s]*/g,
    /https?:\/\/[^\s]*\.4shared\.com\/[^\s]*/g,
    
    // Direct file links
    /https?:\/\/[^\s]+\.(?:txt|md|rtf|csv|json|xml|html|htm)(?:\?[^\s]*)?/g,
  ];

  // Content cleaning for better extraction
  const cleanContent = content
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\t/g, ' ')      // Replace tabs with spaces
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();

  const youtubeLinks: string[] = [];
  const documentLinks: string[] = [];
  const otherLinks: string[] = [];

  // Extract YouTube and video links with more aggressive patterns
  youtubePatterns.forEach(pattern => {
    const matches = cleanContent.match(pattern) || [];
    youtubeLinks.push(...matches);
  });

  // Also search for video links in common text patterns
  const videoLinkPatterns = [
    /(?:video|watch|link|url|resource)[\s:]*https?:\/\/[^\s]+/gi,
    /https?:\/\/[^\s]*(?:youtube|vimeo|dailymotion|twitch)[^\s]*/gi,
    /\bhttps?:\/\/[^\s]*\b/g  // Very general pattern as fallback
  ];

  videoLinkPatterns.forEach(pattern => {
    const matches = cleanContent.match(pattern) || [];
    matches.forEach(match => {
      // Extract just the URL part
      const urlMatch = match.match(/https?:\/\/[^\s]+/);
      if (urlMatch && (
        urlMatch[0].includes('youtube') || 
        urlMatch[0].includes('vimeo') || 
        urlMatch[0].includes('twitch') ||
        urlMatch[0].includes('dailymotion') ||
        urlMatch[0].includes('.mp4') ||
        urlMatch[0].includes('.mov') ||
        urlMatch[0].includes('.avi')
      )) {
        youtubeLinks.push(urlMatch[0]);
      }
    });
  });

  // Extract document links
  documentPatterns.forEach(pattern => {
    const matches = cleanContent.match(pattern) || [];
    documentLinks.push(...matches);
  });

  // Extract all other links more aggressively
  const enhancedLinkPatterns = [
    /https?:\/\/[^\s<>(){}\[\]]+/g,  // More permissive URL pattern
    /www\.[^\s<>(){}\[\]]+\.[a-z]{2,}/gi,  // www links without protocol
  ];

  enhancedLinkPatterns.forEach(pattern => {
    const matches = cleanContent.match(pattern) || [];
    otherLinks.push(...matches.map(link => 
      link.startsWith('www.') ? `https://${link}` : link
    ));
  });

  // Get links that are not already categorized
  const knownLinks = new Set([...youtubeLinks, ...documentLinks]);
  const remainingLinks = otherLinks.filter(link => !knownLinks.has(link));

  // Split document links by type
  const pdfLinks = documentLinks.filter(link => 
    link.toLowerCase().includes('.pdf') || 
    link.toLowerCase().includes('pdf')
  );
  
  const docLinks = documentLinks.filter(link => {
    const lowerLink = link.toLowerCase();
    return (
      lowerLink.includes('.doc') || lowerLink.includes('.docx') || 
      lowerLink.includes('.ppt') || lowerLink.includes('.pptx') ||
      lowerLink.includes('.xls') || lowerLink.includes('.xlsx') ||
      lowerLink.includes('docs.google.com') ||
      lowerLink.includes('drive.google.com') ||
      lowerLink.includes('office.com') ||
      lowerLink.includes('sharepoint.com')
    ) && !pdfLinks.includes(link);
  });
  
  const otherDocLinks = documentLinks.filter(link => 
    !pdfLinks.includes(link) && !docLinks.includes(link)
  );

  remainingLinks.push(...otherDocLinks);
  return {
    youtubeLinks: [...new Set(youtubeLinks)].filter(link => link.length > 10), // Remove duplicates and too short links
    pdfLinks: [...new Set(pdfLinks)].filter(link => link.length > 10),
    docLinks: [...new Set(docLinks)].filter(link => link.length > 10),
    otherLinks: [...new Set(remainingLinks)].filter(link => link.length > 10)
  };
}

// Auto-detect and extract topics from text
export function extractTopicsFromText(content: string): string[] {
  const lines = content.split('\n').map(line => line.trim());
  const topics: string[] = [];
  
  const topicPatterns = [
    /^(topic|course|title|subject|lesson|module|chapter|week)\s*:?\s*(.+)/i,
    /^(week|module|lesson|chapter)\s*\d+\s*:?\s*(.+)/i,
    /^-\s*(.+)/,  // Bullet points
    /^\d+\.\s*(.+)/, // Numbered lists
  ];
  
  for (const line of lines) {
    if (!line || line.length < 3) continue;
    
    for (const pattern of topicPatterns) {
      const match = line.match(pattern);
      if (match) {
        const topic = match[match.length - 1].trim();
        if (topic.length >= 3) {
          topics.push(topic);
        }
        break;
      }
    }
  }
  
  return [...new Set(topics)]; // Remove duplicates
}

// Enhanced bulk document processing
export interface BulkDocumentUpload {
  files: File[];
  metadata: {
    associatedTopic?: string;
    category?: 'reading' | 'exercise' | 'reference' | 'assignment';
    tags?: string[];
  };
}

// Process bulk document uploads
export async function processBulkDocuments(
  uploads: BulkDocumentUpload[]
): Promise<UploadedDocument[]> {
  const processedDocuments: UploadedDocument[] = [];
  
  for (const upload of uploads) {
    for (const file of upload.files) {
      const validation = validateFileUpload(file);
      if (!validation.valid) {
        throw new Error(`File ${file.name}: ${validation.error}`);
      }
      
      // Create document record
      const document: UploadedDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: getFileType(file),
        size: file.size,
        url: '', // Would be set after actual upload
        uploadedAt: new Date().toISOString(),
        userId: upload.metadata.associatedTopic || 'bulk_upload'
      };
      
      processedDocuments.push(document);
    }
  }
  
  return processedDocuments;
}

// Get file type from File object
function getFileType(file: File): 'pdf' | 'doc' | 'docx' {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  switch (extension) {
    case '.pdf': return 'pdf';
    case '.doc': return 'doc';
    case '.docx': return 'docx';
    default: return 'pdf'; // Default fallback
  }
}

// Enhanced import function with text content support
export async function importFromTextContent(
  content: string,
  options: {
    bulkDocuments?: BulkDocumentUpload[];
    autoDetectFields?: boolean;
    customFields?: string[];
  } = {}
): Promise<CourseImportPreview[]> {
  try {
    // Parse text content
    let rawData = await parseTextContent(content);
    
    // If auto-detect is enabled, enhance the data
    if (options.autoDetectFields) {
      const extractedLinks = extractAllLinksFromText(content);
      const extractedTopics = extractTopicsFromText(content);
      
      // If no structured data found, create entries from detected topics
      if (rawData.length === 0 && extractedTopics.length > 0) {
        rawData = extractedTopics.map(topic => ({
          topic,
          youtubeLinks: extractedLinks.youtubeLinks,
          pdfLinks: extractedLinks.pdfLinks,
          docLinks: extractedLinks.docLinks,
          metadata: {
            autoDetected: true,
            allLinks: extractedLinks.otherLinks
          }
        }));
      }
      
      // Enhance existing data with extracted links
      rawData.forEach(item => {
        if (!item.youtubeLinks || item.youtubeLinks.length === 0) {
          item.youtubeLinks = extractedLinks.youtubeLinks;
        }
        if (!item.pdfLinks || item.pdfLinks.length === 0) {
          item.pdfLinks = extractedLinks.pdfLinks;
        }
        if (!item.docLinks || item.docLinks.length === 0) {
          item.docLinks = extractedLinks.docLinks;
        }
      });
    }
    
    // Process bulk documents if provided
    if (options.bulkDocuments && options.bulkDocuments.length > 0) {
      const uploadedDocs = await processBulkDocuments(options.bulkDocuments);
      
      // Associate documents with course entries
      rawData.forEach(item => {
        if (!item.uploadedDocuments) item.uploadedDocuments = [];
        
        // Find documents associated with this topic
        const associatedDocs = uploadedDocs.filter(doc => 
          doc.userId === item.topic || 
          options.bulkDocuments!.some(upload => 
            upload.metadata.associatedTopic === item.topic && 
            upload.files.some(file => file.name === doc.name)
          )
        );
        
        item.uploadedDocuments.push(...associatedDocs);
      });
    }
    
    // Add custom fields if specified
    if (options.customFields && options.customFields.length > 0) {
      rawData.forEach(item => {
        options.customFields!.forEach(field => {
          if (!item[field]) {
            item[field] = ''; // Initialize custom field
          }
        });
      });
    }
    
    // Normalize and validate data
    const previews = rawData.map(item => {
      const normalized = normalizeImportData(item);
      return validateImportPreview(normalized);
    });
    
    return previews;
  } catch (error) {
    throw new Error(`Text import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Parse JSON files  
export async function parseJson(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Use enhanced link extraction on the entire content
        const extractedLinks = extractAllLinksFromText(content);
        
        let records: any[] = [];
        
        if (Array.isArray(parsed)) {
          records = parsed;
        } else if (parsed && typeof parsed === 'object') {
          records = [parsed];
        } else {
          // If it's a simple value, create a basic record
          records = [{
            topic: 'JSON Content',
            description: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
            youtubeLinks: [],
            pdfLinks: [],
            docLinks: [],
            metadata: { source: 'json-simple' }
          }];
        }
        
        // Enhance each record with extracted links
        records.forEach(record => {
          // Recursively extract links from the record itself
          const recordContent = JSON.stringify(record);
          const recordLinks = extractAllLinksFromText(recordContent);
          
          // Initialize arrays if they don't exist
          if (!record.youtubeLinks) record.youtubeLinks = [];
          if (!record.pdfLinks) record.pdfLinks = [];
          if (!record.docLinks) record.docLinks = [];
          if (!record.subtopics) record.subtopics = [];
          if (!record.tasks) record.tasks = [];
          
          // Add extracted links
          record.youtubeLinks.push(...recordLinks.youtubeLinks);
          record.pdfLinks.push(...recordLinks.pdfLinks);
          record.docLinks.push(...recordLinks.docLinks);
          
          // If no topic, try to infer from common fields
          if (!record.topic) {
            record.topic = record.title || record.name || record.course || record.subject || 'JSON Entry';
          }
          
          // Deduplicate
          record.youtubeLinks = [...new Set(record.youtubeLinks)];
          record.pdfLinks = [...new Set(record.pdfLinks)];
          record.docLinks = [...new Set(record.docLinks)];
        });
        
        resolve(records);
      } catch (error) {
        reject(new Error(`Failed to parse JSON file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read JSON file'));
    reader.readAsText(file, 'utf-8');
  });
}

// Parse Markdown files
export async function parseMarkdown(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Use enhanced link extraction on the entire content
        const extractedLinks = extractAllLinksFromText(content);
        
        const lines = content.split('\n');
        const records: any[] = [];
        let currentRecord: any = null;
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Check for headers (markdown)
          if (trimmedLine.match(/^#{1,6}\s+/)) {
            // Save previous record
            if (currentRecord) {
              addExtractedLinksToRecord(currentRecord, extractedLinks);
              records.push(currentRecord);
            }
            
            // Create new record
            currentRecord = {
              topic: trimmedLine.replace(/^#+\s+/, '').trim(),
              youtubeLinks: [],
              pdfLinks: [],
              docLinks: [],
              subtopics: [],
              tasks: [],
              description: '',
              metadata: { source: 'markdown' }
            };
          }
          // Check for bullet points as subtopics
          else if (trimmedLine.match(/^[-*+]\s+/) && currentRecord) {
            const subtopic = trimmedLine.replace(/^[-*+]\s+/, '').trim();
            if (subtopic && !subtopic.includes('http')) {
              currentRecord.subtopics.push(subtopic);
            }
          }
          // Check for numbered lists as subtopics
          else if (trimmedLine.match(/^\d+\.\s+/) && currentRecord) {
            const subtopic = trimmedLine.replace(/^\d+\.\s+/, '').trim();
            if (subtopic && !subtopic.includes('http')) {
              currentRecord.subtopics.push(subtopic);
            }
          }
          // Check for task indicators
          else if (trimmedLine.toLowerCase().includes('task') || 
                   trimmedLine.toLowerCase().includes('exercise') ||
                   trimmedLine.toLowerCase().includes('assignment')) {
            if (currentRecord) {
              currentRecord.tasks.push(trimmedLine);
            }
          }
          // Extract links from the line
          else if (trimmedLine.includes('http')) {
            if (currentRecord) {
              const lineLinks = extractAllLinksFromText(trimmedLine);
              currentRecord.youtubeLinks.push(...lineLinks.youtubeLinks);
              currentRecord.pdfLinks.push(...lineLinks.pdfLinks);
              currentRecord.docLinks.push(...lineLinks.docLinks);
            }
          }
          // Add as description if no description yet
          else if (currentRecord && !currentRecord.description && trimmedLine.length > 10) {
            currentRecord.description = trimmedLine;
          }
        }
        
        // Add the last record
        if (currentRecord) {
          addExtractedLinksToRecord(currentRecord, extractedLinks);
          records.push(currentRecord);
        }
        
        // If no structured content found, create a general record with all extracted links
        if (records.length === 0 && (extractedLinks.youtubeLinks.length > 0 || 
                                     extractedLinks.pdfLinks.length > 0 || 
                                     extractedLinks.docLinks.length > 0)) {
          records.push({
            topic: 'Markdown Content',
            youtubeLinks: extractedLinks.youtubeLinks,
            pdfLinks: extractedLinks.pdfLinks,
            docLinks: extractedLinks.docLinks,
            description: 'Content extracted from Markdown file',
            subtopics: [],
            tasks: [],
            metadata: { source: 'markdown-bulk' }
          });
        }
        
        // Deduplicate links in each record
        records.forEach(record => {
          record.youtubeLinks = [...new Set(record.youtubeLinks)];
          record.pdfLinks = [...new Set(record.pdfLinks)];
          record.docLinks = [...new Set(record.docLinks)];
          record.subtopics = [...new Set(record.subtopics)];
          record.tasks = [...new Set(record.tasks)];
        });
        
        resolve(records);
      } catch (error) {
        reject(new Error(`Failed to parse Markdown file: ${error}`));
           }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Markdown file'));
    reader.readAsText(file, 'utf-8');
  });
}
