
import type { Course, Module, DailyTask, Badge, UserProfile, UserProgress, VideoLink } from './types';

// Helper function to create YouTube embed URL from various link formats
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('watch?v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes('youtube.com/playlist?list=')) {
    const listId = url.split('playlist?list=')[1]?.split('&')[0];
    return listId ? `https://www.youtube.com/embed/videoseries?list=${listId}` : url;
  }
  return url; // Fallback if no specific pattern matches
};


const fullStackDsaDevOpsModules: Module[] = [
  // Week 1-24 based on user input
  {
    id: 'fsdd-mod1', title: 'HTML5 & CSS3', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['HTML structure', 'CSS selectors', 'box model'],
    practiceTask: 'Build a responsive portfolio homepage',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg'), title: 'HTML5 & CSS3 (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=UB1O30fR-EE'), title: 'HTML5 & CSS3 (English)' },
    ],
  },
  {
    id: 'fsdd-mod2', title: 'Advanced CSS (Flexbox & Grid)', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Flexbox properties', 'Grid layout', 'responsive media queries'],
    practiceTask: 'Clone a blog layout using Flexbox & Grid',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=RGOj5yH7evk'), title: 'Advanced CSS (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=EFafSYg-PkI'), title: 'Advanced CSS (English)' },
    ],
  },
  {
    id: 'fsdd-mod3', title: 'JavaScript Basics (ES6)', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Variables', 'functions', 'arrays', 'ES6 syntax'],
    practiceTask: 'Create a JS to-do list or calculator',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLu0W_9lII9agyB6rvIBaAmKX6cFpvLRSU'), title: 'JavaScript Basics (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=upDLs1sn7g4'), title: 'JavaScript Basics (English)' },
    ],
  },
  {
    id: 'fsdd-mod4', title: 'JavaScript Advanced (DOM & Async)', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['DOM manipulation', 'events', 'fetch API', 'Promises/async-await'],
    practiceTask: 'Build a weather app using fetch() API',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=kgwb6VhfpUs'), title: 'JavaScript Advanced (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=PoRJizFvM7s'), title: 'JavaScript Advanced (English)' },
    ],
  },
  {
    id: 'fsdd-mod5', title: 'React Fundamentals', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Components', 'JSX', 'state', 'props', 'useState/useEffect'],
    practiceTask: 'Develop a React to-do or note-taking app',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Ka8iSS7Sl3E'), title: 'React Fundamentals (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=w7ejDZ8SWv8'), title: 'React Fundamentals (English)' },
    ],
  },
  {
    id: 'fsdd-mod6', title: 'React Hooks & Routing', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['React Router', 'Context API', 'advanced hooks'],
    practiceTask: 'Add React Router & Context to your app',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=O6P86uwfdR0'), title: 'React Hooks & Routing (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Law7wfdg_ls'), title: 'React Hooks & Routing (English)' },
    ],
  },
  {
    id: 'fsdd-mod7', title: 'Node.js & Express.js', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Express routing', 'middleware', 'REST API basics'],
    practiceTask: 'Implement CRUD REST API with Express',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=RLtyhwFtXQA'), title: 'Node.js & Express.js (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Oe421EPjeBE'), title: 'Node.js & Express.js (English)' },
    ],
  },
  {
    id: 'fsdd-mod8', title: 'Backend: DB & Auth', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['MongoDB setup', 'Mongoose', 'JWT auth'],
    practiceTask: 'Add JWT-based auth and DB persistence',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=XBMLGnYwKhg'), title: 'Backend: DB & Auth (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ENrzD9HAZK4'), title: 'Backend: DB & Auth (English)' },
    ],
  },
  {
    id: 'fsdd-mod9', title: 'SQL Fundamentals', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Table creation', 'SELECT/JOIN queries'],
    practiceTask: 'Design a SQL schema & write JOIN queries',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=7S_tz1z_5bA'), title: 'SQL Fundamentals (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=HXV3zeQKqGY'), title: 'SQL Fundamentals (English)' },
    ],
  },
  {
    id: 'fsdd-mod10', title: 'NoSQL & GraphQL/Redis', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Redis caching', 'GraphQL query/mutation basics'],
    practiceTask: 'Integrate Redis caching or GraphQL endpoint',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Y0lDGjwRYKw'), title: 'NoSQL & GraphQL/Redis (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ed8SzALpx1Q'), title: 'NoSQL & GraphQL/Redis (English)' },
    ],
  },
  {
    id: 'fsdd-mod11', title: 'Full-Stack MERN Project', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Integrate React, Node, MongoDB, deployment'],
    practiceTask: 'Deploy a MERN app end-to-end',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=7CqJlxBYj-M'), title: 'Full-Stack MERN Project (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ngc9gnGgUdA'), title: 'Full-Stack MERN Project (English)' },
    ],
  },
  {
    id: 'fsdd-mod12', title: 'Front-End Tools (Tailwind/Next.js)', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Tailwind CSS utilities', 'Next.js pages/API routes'],
    practiceTask: 'Convert project to Next.js / use Tailwind CSS',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=UBOj6rqRUME'), title: 'Tailwind/Next.js (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=mTz0GXj8NN0'), title: 'Tailwind/Next.js (English)' },
    ],
  },
  {
    id: 'fsdd-mod13', title: 'DSA: Arrays & Strings', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Two-pointer', 'sliding window', 'string ops'],
    practiceTask: 'Solve 10 array & string LeetCode problems',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=8hly31xKli0'), title: 'DSA: Arrays & Strings (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=RBSGKlAvoiM'), title: 'DSA: Arrays & Strings (English)' },
    ],
  },
  {
    id: 'fsdd-mod14', title: 'DSA: Stacks, Queues, Linked Lists', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Stack/queue ops', 'linked list insertion/deletion'],
    practiceTask: 'Solve 10 stack/queue/linked list problems',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=njTh_OwMljA'), title: 'DSA: Stacks, Queues, Linked Lists (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=wjI1WNcIntg'), title: 'DSA: Stacks, Queues, Linked Lists (English)' },
    ],
  },
  {
    id: 'fsdd-mod15', title: 'DSA: Trees & Graphs', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Tree traversal (DFS/BFS)', 'BST operations'],
    practiceTask: 'Solve 10 tree & graph LeetCode problems',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=oSWTXtMglKE'), title: 'DSA: Trees & Graphs (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=09_LlHjoEiY'), title: 'DSA: Trees & Graphs (English)' },
    ],
  },
  {
    id: 'fsdd-mod16', title: 'DSA: Dynamic Programming', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['1D/2D DP', 'memoization/tabulation patterns'],
    practiceTask: 'Solve 5 dynamic programming problems',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=oBt53YbR9Kk'), title: 'DSA: Dynamic Programming (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=oBt53YbR9Kk'), title: 'DSA: Dynamic Programming (English)' },
    ],
  },
  {
    id: 'fsdd-mod17', title: 'Coding Interview Practice', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Timed problem solving', 'mock interview format'],
    practiceTask: 'Complete 20 timed LeetCode interview problems',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=jDhml3Fqj-0'), title: 'Coding Interview Practice (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLWKjhJtqVAbkArDMazoARtNz1aMwNWmvC'), title: 'Coding Interview Practice (English)' },
    ],
  },
  {
    id: 'fsdd-mod18', title: 'System Design Fundamentals', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Load balancing', 'caching', 'CDNs', 'CAP theorem'],
    practiceTask: 'Draw & explain architecture for a sample system',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=qs83ILxS92o'), title: 'System Design Fundamentals (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyuzo'), title: 'System Design Fundamentals (English)' },
    ],
  },
  {
    id: 'fsdd-mod19', title: 'System Design Patterns', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Microservices', 'message queues', 'database scaling'],
    practiceTask: 'Design two system case studies with diagrams',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyuzo'), title: 'System Design Patterns (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyuzo'), title: 'System Design Patterns (English)' },
    ],
  },
  {
    id: 'fsdd-mod20', title: 'System Design Mocks', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Mock system design interviews', 'feedback'],
    practiceTask: 'Conduct 2 mock system design interviews & debrief',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=3D0l2bIa8y4'), title: 'System Design Mocks (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=6H26G0d-oys'), title: 'System Design Mocks (English)' },
    ],
  },
  {
    id: 'fsdd-mod21', title: 'DevOps & CI/CD', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Git workflows', 'Jenkins/GitHub Actions'],
    practiceTask: 'Configure CI/CD for a project & automate tests',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Ic6BEYBz6SY'), title: 'DevOps & CI/CD (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=SZ09eoFhx1k'), title: 'DevOps & CI/CD (English)' },
    ],
  },
  {
    id: 'fsdd-mod22', title: 'Docker & Kubernetes', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Dockerfiles', 'containers', 'Kubernetes basics'],
    practiceTask: 'Dockerize full-stack app & deploy on local K8s',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=HcwK0Y0wnIM'), title: 'Docker & Kubernetes (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=on18UmlXx0s'), title: 'Docker & Kubernetes (English)' },
    ],
  },
  {
    id: 'fsdd-mod23', title: 'AWS & Cloud Basics', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['EC2', 'S3', 'RDS', 'Lambda', 'IAM'],
    practiceTask: 'Deploy full-stack app on AWS (S3 + EC2 + Lambda)',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ulprqHHWlng'), title: 'AWS & Cloud Basics (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Ia-UEYYR44s'), title: 'AWS & Cloud Basics (English)' },
    ],
  },
  {
    id: 'fsdd-mod24', title: 'Soft Skills & Interview Prep', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['STAR method', 'resume polish', 'behavioral Q&A'],
    practiceTask: 'Prepare & record 5 STAR method behavioral answers',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=2nI4i2pTlPQ'), title: 'Soft Skills & Interview Prep (Hinglish)' },
      { langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Q6QXyq9Iqyk'), title: 'Soft Skills & Interview Prep (English)' },
    ],
  },
];

const englishCommModules: Module[] = [
  {
    id: 'ec-mod1', title: 'Self-Introduction & Daily Conversation', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Introductions, greetings, basic Q&A'], practiceTask: 'Record self-intro; get feedback',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Learnex', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PL1XYZ_hindi_intro'), title: 'Self-Introduction (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Learn English Lab', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=english_intro_eng'), title: 'Self-Introduction (English)' },
    ],
  },
  {
    id: 'ec-mod2', title: 'Listening Comprehension & Pronunciation', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Listening to short audio, minimal pairs'], practiceTask: 'Shadow 5-min news clip; summarize',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Angrezi Sikho', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=audio_pron_hindi'), title: 'Listening & Pronunciation (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Learn English Lab', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=pronunciation_eng'), title: 'Listening & Pronunciation (English)' },
    ],
  },
  {
    id: 'ec-mod3', title: 'Speaking Fluency – Everyday Topics', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Role-play common scenarios'], practiceTask: 'Role-play conversation; fluency drill',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=speaking_fluency_hindi'), title: 'Speaking Fluency (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'FluentU', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=speaking_fluency_eng'), title: 'Speaking Fluency (English)' },
    ],
  },
  {
    id: 'ec-mod4', title: 'Business Vocabulary & Formal Expressions', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Formal vs. casual tone, email phrases'], practiceTask: 'Write 3 formal email sentences',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Angrezi Sikho', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=business_vocab_hindi'), title: 'Business Vocabulary (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'British Council', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=business_vocab_eng'), title: 'Business Vocabulary (English)' },
    ],
  },
  {
    id: 'ec-mod5', title: 'Grammar Refresher – Common Structures', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Tenses, conditionals, modals'], practiceTask: 'Complete tense fill worksheet',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Learnex', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=grammar_refresher_hindi'), title: 'Grammar Refresher (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Khan Academy', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=grammar_refresher_eng'), title: 'Grammar Refresher (English)' },
    ],
  },
  {
    id: 'ec-mod6', title: 'Writing Emails & Professional Messages', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Email structure and templates'], practiceTask: 'Draft a professional email',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Apna College', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=email_writing_hindi'), title: 'Email Writing (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Indeed', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=email_writing_eng'), title: 'Email Writing (English)' },
    ],
  },
  {
    id: 'ec-mod7', title: 'Resume/CV Writing', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Resume sections and formatting'], practiceTask: 'Create and peer-review resume',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Career Guides', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=resume_writing_hindi'), title: 'Resume/CV Writing (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Indeed', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=resume_writing_eng'), title: 'Resume/CV Writing (English)' },
    ],
  },
  {
    id: 'ec-mod8', title: 'Essay & Report Writing Basics', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Paragraph structure, linking words'], practiceTask: 'Write 200-word essay; peer edit',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Angrezi Sikho', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=essay_writing_hindi'), title: 'Essay Writing (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Khan Academy', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=essay_writing_eng'), title: 'Essay Writing (English)' },
    ],
  },
  {
    id: 'ec-mod9', title: 'Advanced Speaking – Interviews & Presentations', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Interview Q&A, presentation phrases'], practiceTask: 'Deliver 3-min tech topic presentation',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Learn English Lab', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=interview_speaking_hindi'), title: 'Advanced Speaking (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Learn English Lab', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=interview_speaking_eng'), title: 'Advanced Speaking (English)' },
    ],
  },
  {
    id: 'ec-mod10', title: 'Behavioral Interviews & STAR Method', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['STAR framework for behavioral answers'], practiceTask: 'Outline 3 STAR stories',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Hindi tutorial', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=star_method_hindi'), title: 'STAR Method (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'MIT Career Guide', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=star_method_eng'), title: 'STAR Method (English)' },
    ],
  },
  {
    id: 'ec-mod11', title: 'Mock Interviews & Feedback', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Full mock interviews, peer feedback'], practiceTask: 'Conduct & review 2 mock interviews',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Career Guides', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=mock_interview_hindi'), title: 'Mock Interviews (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=mock_interview_eng'), title: 'Mock Interviews (English)' },
    ],
  },
  {
    id: 'ec-mod12', title: 'Review & Advanced Practice', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Industry vocabulary, negotiation phrases'], practiceTask: 'Learn 10 vocab + role-play scenarios',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Angrezi Sikho', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=advanced_practice_hindi'), title: 'Advanced Practice (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'TheMuse', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=advanced_practice_eng'), title: 'Advanced Practice (English)' },
    ],
  },
];

const designAiModules: Module[] = [
  {
    id: 'dai-mod1', title: 'UI/UX Design with Figma', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Frames, shapes, prototyping'], practiceTask: 'Recreate login screen in Figma',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=figma_hindi'), title: 'Figma (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=figma_eng'), title: 'Figma (English)' },
    ],
  },
  {
    id: 'dai-mod2', title: 'Advanced Figma & Framer AI', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['AI-driven design generation'], practiceTask: 'Generate UI via Framer AI and refine',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=framer_ai_hindi'), title: 'Framer AI (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=framer_ai_eng'), title: 'Framer AI (English)' },
    ],
  },
  {
    id: 'dai-mod3', title: 'Project Management with Notion', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Databases, templates, AI summaries'], practiceTask: 'Set up Notion project board',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Stephen Simon', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=notion_hindi'), title: 'Notion (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Notion', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=notion_eng'), title: 'Notion (English)' },
    ],
  },
  {
    id: 'dai-mod4', title: 'Video Editing with Adobe Premiere Pro', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Timeline editing, transitions'], practiceTask: 'Edit 30-sec video',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'XOMultimedia', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=premiere_hindi'), title: 'Premiere Pro (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Adobe', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=premiere_eng'), title: 'Premiere Pro (English)' },
    ],
  },
  {
    id: 'dai-mod5', title: 'ChatGPT & Prompt Engineering', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Effective prompts, examples'], practiceTask: 'Refine ChatGPT prompt',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Harshit Vaidya', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=chatgpt_prompt_hindi'), title: 'ChatGPT Prompts (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=chatgpt_prompt_eng'), title: 'ChatGPT Prompts (English)' },
    ],
  },
  {
    id: 'dai-mod6', title: 'GitHub Copilot & VS Code', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Copilot setup, VS Code extensions'], practiceTask: 'Use Copilot for function',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=copilot_hindi'), title: 'GitHub Copilot (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'GitHub', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=copilot_eng'), title: 'GitHub Copilot (English)' },
    ],
  },
  {
    id: 'dai-mod7', title: 'Tailwind CSS Basics', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Utility classes, responsive design'], practiceTask: 'Build page with Tailwind',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=tailwind_hindi'), title: 'Tailwind CSS (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Traversy Media', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=tailwind_eng'), title: 'Tailwind CSS (English)' },
    ],
  },
  {
    id: 'dai-mod8', title: 'Bootstrap Basics', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Grid system, components'], practiceTask: 'Clone Bootstrap landing',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=bootstrap_hindi'), title: 'Bootstrap (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=bootstrap_eng'), title: 'Bootstrap (English)' },
    ],
  },
  {
    id: 'dai-mod9', title: 'Next.js Introduction', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Pages, routing, CSS modules'], practiceTask: 'Create Next.js site',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Apna College', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=nextjs_hindi'), title: 'Next.js (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Vercel', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=nextjs_eng'), title: 'Next.js (English)' },
    ],
  },
  {
    id: 'dai-mod10', title: 'Design-to-Code Integration', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Convert Figma designs to code'], practiceTask: 'Implement design in code',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=figma_to_code_hindi'), title: 'Figma to Code (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=figma_to_code_eng'), title: 'Figma to Code (English)' },
    ],
  },
  {
    id: 'dai-mod11', title: 'ML Basics', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Supervised vs unsupervised learning'], practiceTask: 'Describe ML use-case',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Generic ML Hindi', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ml_basics_hindi'), title: 'ML Basics (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Fullstack Academy', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ml_basics_eng'), title: 'ML Basics (English)' },
    ],
  },
  {
    id: 'dai-mod12', title: 'LLM Fundamentals', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Transformers, GPT overview'], practiceTask: 'Summarize LLM workings',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Generic AI Hindi', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=llm_hindi'), title: 'LLM Fundamentals (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'OpenAI', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=llm_eng'), title: 'LLM Fundamentals (English)' },
    ],
  },
  {
    id: 'dai-mod13', title: 'API & AI Tools Workshop', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['HTTP, Postman, OpenAI API'], practiceTask: 'Call OpenAI API',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Harshit Vaidya', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=api_ai_hindi'), title: 'API & AI Tools (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=api_ai_eng'), title: 'API & AI Tools (English)' },
    ],
  },
  {
    id: 'dai-mod14', title: 'AI Productivity Tools', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Notion AI, DALL·E demos'], practiceTask: 'Use Notion AI summary',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'XOMultimedia', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ai_tools_hindi'), title: 'AI Productivity Tools (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Industry Blogs', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=ai_tools_eng'), title: 'AI Productivity Tools (English)' },
    ],
  },
  {
    id: 'dai-mod15', title: 'Integrated Capstone Project', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Design & build demo app'], practiceTask: 'Build & demo project',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Multiple', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=capstone_hindi'), title: 'Capstone Project (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Multiple', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=capstone_eng'), title: 'Capstone Project (English)' },
    ],
  },
];

const aptitudeModules: Module[] = [
  {
    id: 'apt-mod1', title: 'Arithmetic & Number Concepts', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Percentages, ratios, speed/time'], practiceTask: 'Solve 10 arithmetic problems',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Adda247', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=quant_hindi1'), title: 'Arithmetic (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'KhanAcademy', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=quant_eng'), title: 'Arithmetic (English)' },
    ],
  },
  {
    id: 'apt-mod2', title: 'Algebra & Series', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Quadratics, sequences'], practiceTask: 'Solve 5 quadratic puzzles',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'FacePrep', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=algebra_hindi'), title: 'Algebra (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=algebra_eng'), title: 'Algebra (English)' },
    ],
  },
  {
    id: 'apt-mod3', title: 'Probability & Data Interpretation', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Basic probability, charts'], practiceTask: 'Answer 5 probability questions',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Examrace', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=prob_data_hindi'), title: 'Probability & DI (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'KhanAcademy', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=prob_data_eng'), title: 'Probability & DI (English)' },
    ],
  },
  {
    id: 'apt-mod4', title: 'Logical Series & Patterns', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Numeric/alpha series'], practiceTask: 'Solve 8 series problems',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'MeraPlacementHoga', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=series_hindi'), title: 'Logical Series (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Britannica', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=series_eng'), title: 'Logical Series (English)' },
    ],
  },
  {
    id: 'apt-mod5', title: 'Coding/Decoding & Puzzles', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Letter codes, seating puzzles'], practiceTask: 'Crack 5 coding-decoding puzzles',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'HandaKaFunda', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=code_decode_hindi'), title: 'Coding/Decoding (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'MBA_Rendezvous', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=code_decode_eng'), title: 'Coding/Decoding (English)' },
    ],
  },
  {
    id: 'apt-mod6', title: 'Grammar & Vocabulary', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Sentence correction, flashcards'], practiceTask: 'Complete 10 grammar MCQs',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Learnex', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=grammar_vocab_hindi'), title: 'Grammar & Vocab (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'GrammarlyBlog', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=grammar_vocab_eng'), title: 'Grammar & Vocab (English)' },
    ],
  },
  {
    id: 'apt-mod7', title: 'Reading Comprehension', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Passage analysis, summary'], practiceTask: 'Answer 5 comprehension questions',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'StudyIQ', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=comp_hindi'), title: 'Reading Comprehension (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'BritishCouncil', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=comp_eng'), title: 'Reading Comprehension (English)' },
    ],
  },
  {
    id: 'apt-mod8', title: 'Full-Length Mock Tests', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Mixed quant, logical, verbal timed test'], practiceTask: 'Take a 60-question timed mock test',
    videoLinks: [
      { langCode: 'hi', langName: 'Hinglish', creator: 'Adda247', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=mock_test_hindi'), title: 'Mock Tests (Hinglish)' },
      { langCode: 'en', langName: 'English', creator: 'Indiabix', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=mock_test_eng'), title: 'Mock Tests (English)' },
    ],
  },
];


export const placeholderCourses: Course[] = [
  {
    id: 'skillify-fsdd-01',
    title: 'Full-Stack, DSA & DevOps Mastery Program',
    description: 'A comprehensive 24-week program covering the entire spectrum of web development, data structures, algorithms, and DevOps practices.',
    instructor: 'Skillify Experts',
    category: 'Full-Stack, DSA & DevOps',
    icon: 'Code',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'coding development',
    modules: fullStackDsaDevOpsModules,
    duration: '24 Weeks',
    rating: 4.9,
    enrollmentCount: 3500,
    authorId: 'skillify-platform-admin',
  },
  {
    id: 'skillify-ec-01',
    title: 'English Communication Excellence',
    description: 'A 12-week course to enhance your English speaking, listening, writing, and professional communication skills.',
    instructor: 'Language Specialists',
    category: 'English Communication',
    icon: 'Mic',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'language learning',
    modules: englishCommModules,
    duration: '12 Weeks',
    rating: 4.7,
    enrollmentCount: 1800,
    authorId: 'skillify-platform-admin',
  },
  {
    id: 'skillify-dait-01',
    title: 'Design & AI Tools for Modern Creatives',
    description: 'A 15-week journey into UI/UX design, popular creative software, and leveraging AI tools for enhanced productivity.',
    instructor: 'Creative Tech Gurus',
    category: 'Design & AI Tools',
    icon: 'Palette',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'design creative',
    modules: designAiModules,
    duration: '15 Weeks',
    rating: 4.8,
    enrollmentCount: 1200,
    authorId: 'skillify-platform-admin',
  },
  {
    id: 'skillify-ap-01',
    title: 'Aptitude & Logical Reasoning Accelerator',
    description: 'An 8-week intensive course to sharpen your quantitative, logical, and verbal reasoning skills for competitive exams.',
    instructor: 'Aptitude Coaches',
    category: 'Aptitude Prep',
    icon: 'Brain',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'puzzle logic',
    modules: aptitudeModules,
    duration: '8 Weeks',
    rating: 4.6,
    enrollmentCount: 2100,
    authorId: 'skillify-platform-admin',
  },
];

export const placeholderUserProfile: UserProfile = {
  id: 'user-alex-johnson-123',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  dataAiHint: 'profile person',
  points: 1250,
  earnedBadges: [
    { id: 'badge1', name: 'Fast Learner', description: 'Completed 5 modules in a day', icon: 'Zap', color: 'text-yellow-400' },
    { id: 'badge2', name: 'Course Completer', description: 'Finished a full course', icon: 'Award', color: 'text-green-400' },
  ],
  enrolledCourses: ['skillify-fsdd-01', 'skillify-ec-01'], // Updated with new course IDs
  role: 'educator',
  learningPreferences: {
    tracks: ['Full-Stack, DSA & DevOps', 'English Communication'],
    language: 'English',
  },
  profileSetupComplete: true,
};

export const placeholderDailyPlan: DailyTask[] = [
  { id: 'task1', title: 'HTML5 & CSS3 - Module 1', courseId: 'skillify-fsdd-01', moduleId: 'fsdd-mod1', courseTitle: 'Full-Stack, DSA & DevOps', moduleTitle: 'HTML5 & CSS3', time: '9:00 AM - 11:00 AM', isCompleted: false, type: 'coursework', icon: 'Briefcase' },
  { id: 'task2', title: 'Review Self-Introduction', courseId: 'skillify-ec-01', moduleId: 'ec-mod1', courseTitle: 'English Communication', moduleTitle: 'Self-Introduction & Daily Conversation', time: '11:30 AM - 12:30 PM', isCompleted: false, type: 'review', icon: 'Clock' },
];

export const placeholderUserProgress: UserProgress[] = [
  { courseId: 'skillify-fsdd-01', completedModules: [], totalModules: fullStackDsaDevOpsModules.length, currentModuleId: 'fsdd-mod1' },
  { courseId: 'skillify-ec-01', completedModules: [], totalModules: englishCommModules.length, currentModuleId: 'ec-mod1' },
];

export const placeholderBadges: Badge[] = [
  { id: 'badge1', name: 'Initiator', description: 'Started your first course!', icon: 'Star', color: 'text-yellow-500' },
  { id: 'badge2', name: 'Module Master', description: 'Completed 10 modules.', icon: 'CheckCircle', color: 'text-green-500' },
  { id: 'badge3', name: 'Course Champion', description: 'Finished your first course.', icon: 'Award', color: 'text-blue-500' },
];

export const getCourseById = (id: string): Course | undefined => {
  return placeholderCourses.find(course => course.id === id);
};

export const getModuleById = (courseId: string, moduleId: string): Module | undefined => {
  const course = getCourseById(courseId);
  return course?.modules.find(module => module.id === moduleId);
};

export const getProgressForCourse = (courseId: string): UserProgress | undefined => {
  return placeholderUserProgress.find(progress => progress.courseId === courseId);
};
