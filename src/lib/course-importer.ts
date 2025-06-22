// src/lib/course-importer.ts
import * as YAML from 'yaml';
import { v4 as uuidv4 } from 'uuid';
import type { Course as CourseType, Module as ModuleType, VideoLink } from './types';

export interface YamlCourseData {
  Overview?: {
    Course: string;
    'Duration (Weeks)': number;
    Modules: number;
  }[];
  [courseName: string]: any;
}

export interface ParsedYamlCourse {
  courseName: string;
  duration: number;
  totalModules: number;
  modules: ParsedYamlModule[];
}

export interface ParsedYamlModule {
  week?: number;
  topic: string;
  subtopics?: string;
  hinglishResourceLink?: string;
  englishResourceLink?: string;
  practiceTask?: string;
  creator?: string;
  description?: string;
}

export class CourseImporter {
  static parseYamlContent(yamlContent: string): ParsedYamlCourse[] {
    try {
      const parsedData: YamlCourseData = YAML.parse(yamlContent);
      const courses: ParsedYamlCourse[] = [];

      // Extract overview information
      const overview = parsedData.Overview || [];
      const overviewMap = new Map<string, { duration: number; modules: number }>();
      
      overview.forEach(item => {
        if (item.Course && item['Duration (Weeks)'] && item.Modules) {
          overviewMap.set(item.Course, {
            duration: item['Duration (Weeks)'],
            modules: item.Modules
          });
        }
      });

      // Process each course section
      Object.keys(parsedData).forEach(key => {
        if (key === 'Overview') return;

        const courseData = parsedData[key];
        if (Array.isArray(courseData)) {
          const modules: ParsedYamlModule[] = [];

          courseData.forEach(moduleData => {
            if (typeof moduleData === 'object' && moduleData !== null) {
              const module: ParsedYamlModule = {
                week: moduleData.Week || moduleData.week,
                topic: moduleData['Tech Topic'] || moduleData.Topic || moduleData.topic || 'Untitled Module',
                subtopics: moduleData.Subtopics || moduleData.subtopics || '',
                hinglishResourceLink: moduleData['Hinglish Resource Link'] || moduleData.hinglishResourceLink,
                englishResourceLink: moduleData['English Resource Link'] || moduleData.englishResourceLink,
                practiceTask: moduleData['Practice Task'] || moduleData.practiceTask || moduleData.task,
                creator: moduleData['Hinglish Creator'] || moduleData['English Creator'] || moduleData.creator,
                description: moduleData.Description || moduleData.description
              };
              modules.push(module);
            }
          });

          const overviewInfo = overviewMap.get(key) || { duration: 12, modules: modules.length };
          
          courses.push({
            courseName: key,
            duration: overviewInfo.duration,
            totalModules: overviewInfo.modules,
            modules
          });
        }
      });

      return courses;
    } catch (error) {
      console.error('YAML parsing error:', error);
      throw new Error(`Failed to parse YAML content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }  static convertToSystemCourses(yamlCourses: ParsedYamlCourse[], authorId: string): CourseType[] {
    return yamlCourses.map(yamlCourse => {
      // Track URLs across all modules in the course to prevent duplicates
      const courseWideSeenUrls = new Set<string>();
      
      const modules: ModuleType[] = yamlCourse.modules.map((yamlModule, index) => {
        const videoLinks: VideoLink[] = [];
        const additionalResources: { url: string; title: string; type: string }[] = [];
        
        // Extract video links from resource URLs
        if (yamlModule.hinglishResourceLink) {
          if (this.isYouTubeUrl(yamlModule.hinglishResourceLink)) {
            const embedUrl = this.convertToEmbedUrl(yamlModule.hinglishResourceLink);
            if (embedUrl && !courseWideSeenUrls.has(embedUrl)) {
              courseWideSeenUrls.add(embedUrl);
              videoLinks.push({
                id: uuidv4(),
                langCode: 'hi',
                langName: 'Hindi',
                youtubeEmbedUrl: embedUrl,
                title: `${yamlModule.topic} - Hindi Tutorial`,
                creator: yamlModule.creator || 'Unknown',
                isPlaylist: yamlModule.hinglishResourceLink.includes('playlist')
              });
            }
          } else {
            // Handle non-YouTube resources (docs, PDFs, websites, etc.)
            additionalResources.push({
              url: yamlModule.hinglishResourceLink,
              title: `${yamlModule.topic} - Hindi Resource`,
              type: this.determineResourceType(yamlModule.hinglishResourceLink)
            });
          }
        }

        if (yamlModule.englishResourceLink) {
          if (this.isYouTubeUrl(yamlModule.englishResourceLink)) {
            const embedUrl = this.convertToEmbedUrl(yamlModule.englishResourceLink);
            if (embedUrl && !courseWideSeenUrls.has(embedUrl)) {
              courseWideSeenUrls.add(embedUrl);
              videoLinks.push({
                id: uuidv4(),
                langCode: 'en',
                langName: 'English',
                youtubeEmbedUrl: embedUrl,
                title: `${yamlModule.topic} - English Tutorial`,
                creator: yamlModule.creator || 'Unknown',
                isPlaylist: yamlModule.englishResourceLink.includes('playlist')
              });
            }
          } else {
            // Handle non-YouTube resources
            additionalResources.push({
              url: yamlModule.englishResourceLink,
              title: `${yamlModule.topic} - English Resource`,
              type: this.determineResourceType(yamlModule.englishResourceLink)
            });
          }
        }

        // Build enhanced content data with additional resources
        let contentData = yamlModule.description || yamlModule.subtopics || '';
        if (additionalResources.length > 0) {
          contentData += '\n\n**Additional Resources:**\n';
          additionalResources.forEach(resource => {
            contentData += `- [${resource.title}](${resource.url}) (${resource.type})\n`;
          });
        }

        return {
          id: uuidv4(),
          title: yamlModule.topic,
          description: yamlModule.description || yamlModule.subtopics || `Learn about ${yamlModule.topic}`,
          contentType: this.determineContentType(yamlModule),
          estimatedTime: '1 week',
          subtopics: yamlModule.subtopics ? yamlModule.subtopics.split(',').map(s => s.trim()).filter(s => s) : [],
          practiceTask: yamlModule.practiceTask || '',
          videoLinks,
          contentUrl: this.getPrimaryContentUrl(yamlModule, videoLinks, additionalResources),
          contentData: contentData.trim()
        };
      });return {
        id: uuidv4(),
        title: yamlCourse.courseName.replace(/[&]/g, 'and').trim(),
        description: `Comprehensive ${yamlCourse.courseName} course with ${yamlCourse.modules.length} modules covering essential topics and practical skills.`,
        instructor: 'Imported Course',
        category: this.categorizeCourseName(yamlCourse.courseName),
        icon: '📚',
        modules,
        authorId,
        visibility: 'shared' as const,
        status: 'draft' as const,
        imageUrl: 'https://placehold.co/600x400.png',
        duration: `${yamlCourse.duration} weeks`,
        lastModified: new Date().toISOString(),
        suggestedSchedule: this.generateScheduleFromModules(yamlCourse.modules, yamlCourse.duration)
      };
    });
  }
  private static isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  private static determineResourceType(url: string): string {
    if (!url) return 'Unknown';
    
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('.pdf')) return 'PDF Document';
    if (lowerUrl.includes('.doc') || lowerUrl.includes('.docx')) return 'Word Document';
    if (lowerUrl.includes('.ppt') || lowerUrl.includes('.pptx')) return 'Presentation';
    if (lowerUrl.includes('.xls') || lowerUrl.includes('.xlsx')) return 'Spreadsheet';
    if (lowerUrl.includes('github.com') || lowerUrl.includes('gitlab.com')) return 'Code Repository';
    if (lowerUrl.includes('medium.com') || lowerUrl.includes('dev.to')) return 'Article';
    if (lowerUrl.includes('stackoverflow.com')) return 'Q&A Forum';
    if (lowerUrl.includes('docs.') || lowerUrl.includes('documentation')) return 'Documentation';
    if (lowerUrl.includes('blog')) return 'Blog Post';
    if (lowerUrl.includes('tutorial')) return 'Tutorial';
    if (lowerUrl.includes('.png') || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.gif')) return 'Image';
    
    return 'Web Resource';
  }

  private static determineContentType(yamlModule: ParsedYamlModule): 'video' | 'text' {
    // Check if there are any YouTube URLs in the resource links
    const hasYouTubeContent = (yamlModule.hinglishResourceLink && this.isYouTubeUrl(yamlModule.hinglishResourceLink)) ||
                              (yamlModule.englishResourceLink && this.isYouTubeUrl(yamlModule.englishResourceLink));
    
    return hasYouTubeContent ? 'video' : 'text';
  }

  private static getPrimaryContentUrl(yamlModule: ParsedYamlModule, videoLinks: VideoLink[], additionalResources?: { url: string; title: string; type: string }[]): string {
    // If we have video links, return the first one
    if (videoLinks.length > 0) {
      return videoLinks[0].youtubeEmbedUrl;
    }

    // If we have additional resources, return the first one
    if (additionalResources && additionalResources.length > 0) {
      return additionalResources[0].url;
    }

    // If we have document links or other resources, return them
    if (yamlModule.englishResourceLink && !this.isYouTubeUrl(yamlModule.englishResourceLink)) {
      return yamlModule.englishResourceLink;
    }

    if (yamlModule.hinglishResourceLink && !this.isYouTubeUrl(yamlModule.hinglishResourceLink)) {
      return yamlModule.hinglishResourceLink;
    }

    return '';
  }
  private static convertToEmbedUrl(url: string): string | null {
    try {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return null;
      }

      const cleanUrl = url.trim();

      // Handle playlist URLs
      if (cleanUrl.includes('playlist?list=')) {
        const playlistId = cleanUrl.split('playlist?list=')[1].split('&')[0];
        if (playlistId && playlistId.trim() !== '') {
          return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
        }
      }

      // Handle watch URLs with playlist
      if (cleanUrl.includes('watch?') && cleanUrl.includes('list=')) {
        const urlParams = new URLSearchParams(cleanUrl.split('?')[1]);
        const videoId = urlParams.get('v');
        const listId = urlParams.get('list');
        if (videoId && listId && videoId.trim() !== '' && listId.trim() !== '') {
          return `https://www.youtube.com/embed/${videoId}?list=${listId}`;
        }
      }

      // Handle regular watch URLs
      if (cleanUrl.includes('watch?v=')) {
        const videoId = cleanUrl.split('watch?v=')[1].split('&')[0];
        if (videoId && videoId.trim() !== '') {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // Handle youtu.be URLs
      if (cleanUrl.includes('youtu.be/')) {
        const videoId = cleanUrl.split('youtu.be/')[1].split('?')[0];
        if (videoId && videoId.trim() !== '') {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      return null; // Return null for unrecognized formats
    } catch (error) {
      console.warn('Failed to convert YouTube URL:', url, error);
      return null;
    }
  }

  private static categorizeCourseName(courseName: string): string {
    const name = courseName.toLowerCase();
    
    if (name.includes('full-stack') || name.includes('web development') || name.includes('javascript') || name.includes('react') || name.includes('node')) {
      return 'Web Development';
    }
    if (name.includes('dsa') || name.includes('algorithm') || name.includes('data structure')) {
      return 'Programming';
    }
    if (name.includes('devops') || name.includes('docker') || name.includes('kubernetes')) {
      return 'DevOps';
    }
    if (name.includes('english') || name.includes('communication')) {
      return 'Language Learning';
    }
    if (name.includes('design') || name.includes('ui') || name.includes('ux') || name.includes('figma')) {
      return 'Design';
    }
    if (name.includes('ai') || name.includes('machine learning') || name.includes('ml')) {
      return 'AI & Machine Learning';
    }
    if (name.includes('aptitude') || name.includes('interview')) {
      return 'Interview Preparation';
    }
    
    return 'General';
  }

  private static generateScheduleFromModules(modules: ParsedYamlModule[], totalWeeks: number): string {
    let schedule = `# ${modules.length > 0 ? 'Course' : 'Imported Course'} Schedule\n\n`;
    schedule += `**Duration:** ${totalWeeks} weeks\n`;
    schedule += `**Total Modules:** ${modules.length}\n\n`;

    modules.forEach((module, index) => {
      const weekNumber = module.week || (index + 1);
      schedule += `## Week ${weekNumber}: ${module.topic}\n\n`;
      
      if (module.subtopics) {
        schedule += `**Topics Covered:**\n`;
        schedule += `- ${module.subtopics.split(',').map(s => s.trim()).join('\n- ')}\n\n`;
      }

      if (module.practiceTask) {
        schedule += `**Practice Task:** ${module.practiceTask}\n\n`;
      }

      if (module.hinglishResourceLink || module.englishResourceLink) {
        schedule += `**Resources:**\n`;
        if (module.hinglishResourceLink) {
          schedule += `- [Hindi Tutorial](${module.hinglishResourceLink})\n`;
        }
        if (module.englishResourceLink) {
          schedule += `- [English Tutorial](${module.englishResourceLink})\n`;
        }
        schedule += '\n';
      }

      schedule += '---\n\n';
    });

    return schedule;
  }

  static async processFiles(files: FileList): Promise<CourseType[]> {
    const allCourses: CourseType[] = [];

    for (const file of Array.from(files)) {
      try {
        const content = await this.readFileContent(file);
        
        if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
          const yamlCourses = this.parseYamlContent(content);
          const systemCourses = this.convertToSystemCourses(yamlCourses, 'imported-user');
          allCourses.push(...systemCourses);
        } else if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          // Handle JSON format if needed
          console.log('JSON processing not yet implemented:', jsonData);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return allCourses;
  }

  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }
}
