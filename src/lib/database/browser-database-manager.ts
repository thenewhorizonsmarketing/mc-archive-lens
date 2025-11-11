// Browser-Compatible Database Manager with Mock Data
import { DatabaseManager } from './manager';
import { SearchResult, SearchFilters, AlumniRecord, PublicationRecord, PhotoRecord, FacultyRecord } from './types';

export interface MockDataItem {
  id: string;
  type: 'alumni' | 'publication' | 'photo' | 'faculty';
  title: string;
  content: string;
  metadata: Record<string, any>;
  thumbnail?: string;
}

export class BrowserDatabaseManager extends DatabaseManager {
  private mockData: MockDataItem[] = [];
  private browserInitialized = false;
  private realDataLoaded = false;

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample alumni data - expanded with more names for better testing
    this.mockData.push(
      {
        id: 'alumni_001',
        type: 'alumni',
        title: 'John Smith',
        content: 'Computer Science graduate, Class of 2015. Currently working at Google as a Software Engineer.',
        metadata: {
          name: 'John Smith',
          firstName: 'John',
          lastName: 'Smith',
          year: 2015,
          department: 'Computer Science',
          classYear: '2015',
          currentPosition: 'Software Engineer at Google',
          tags: ['computer science', 'software engineering', 'google']
        }
      },
      {
        id: 'alumni_002',
        type: 'alumni',
        title: 'Sarah Johnson',
        content: 'Electrical Engineering graduate, Class of 2018. PhD candidate at MIT.',
        metadata: {
          name: 'Sarah Johnson',
          firstName: 'Sarah',
          lastName: 'Johnson',
          year: 2018,
          department: 'Electrical Engineering',
          classYear: '2018',
          currentPosition: 'PhD Candidate at MIT',
          tags: ['electrical engineering', 'phd', 'mit', 'research']
        }
      },
      {
        id: 'alumni_003',
        type: 'alumni',
        title: 'Michael Chen',
        content: 'Business Administration graduate, Class of 2016. Entrepreneur and startup founder.',
        metadata: {
          name: 'Michael Chen',
          firstName: 'Michael',
          lastName: 'Chen',
          year: 2016,
          department: 'Business Administration',
          classYear: '2016',
          currentPosition: 'CEO at TechStart Inc.',
          tags: ['business', 'entrepreneur', 'startup']
        }
      },
      {
        id: 'alumni_004',
        type: 'alumni',
        title: 'Emily Davis',
        content: 'Law graduate, Class of 2019. Associate at major law firm.',
        metadata: {
          name: 'Emily Davis',
          firstName: 'Emily',
          lastName: 'Davis',
          year: 2019,
          department: 'Law',
          classYear: '2019',
          currentPosition: 'Associate Attorney',
          tags: ['law', 'attorney', 'legal']
        }
      },
      {
        id: 'alumni_005',
        type: 'alumni',
        title: 'David Martinez',
        content: 'Medicine graduate, Class of 2017. Resident physician at City Hospital.',
        metadata: {
          name: 'David Martinez',
          firstName: 'David',
          lastName: 'Martinez',
          year: 2017,
          department: 'Medicine',
          classYear: '2017',
          currentPosition: 'Resident Physician',
          tags: ['medicine', 'doctor', 'healthcare']
        }
      },
      {
        id: 'alumni_006',
        type: 'alumni',
        title: 'Jennifer Lee',
        content: 'Architecture graduate, Class of 2020. Junior architect at Design Studio.',
        metadata: {
          name: 'Jennifer Lee',
          firstName: 'Jennifer',
          lastName: 'Lee',
          year: 2020,
          department: 'Architecture',
          classYear: '2020',
          currentPosition: 'Junior Architect',
          tags: ['architecture', 'design', 'buildings']
        }
      },
      {
        id: 'alumni_007',
        type: 'alumni',
        title: 'Robert Wilson',
        content: 'Physics graduate, Class of 2014. Research scientist at National Lab.',
        metadata: {
          name: 'Robert Wilson',
          firstName: 'Robert',
          lastName: 'Wilson',
          year: 2014,
          department: 'Physics',
          classYear: '2014',
          currentPosition: 'Research Scientist',
          tags: ['physics', 'research', 'science']
        }
      },
      {
        id: 'alumni_008',
        type: 'alumni',
        title: 'Amanda Brown',
        content: 'Psychology graduate, Class of 2021. Clinical psychologist in private practice.',
        metadata: {
          name: 'Amanda Brown',
          firstName: 'Amanda',
          lastName: 'Brown',
          year: 2021,
          department: 'Psychology',
          classYear: '2021',
          currentPosition: 'Clinical Psychologist',
          tags: ['psychology', 'mental health', 'therapy']
        }
      }
    );

    // Sample publication data
    this.mockData.push(
      {
        id: 'pub_001',
        type: 'publication',
        title: 'Advanced Machine Learning Techniques in Computer Vision',
        content: 'This paper presents novel approaches to machine learning in computer vision applications, focusing on deep neural networks and their optimization.',
        metadata: {
          author: 'Dr. Michael Chen',
          year: 2023,
          publicationType: 'Journal Article',
          department: 'Computer Science',
          journal: 'IEEE Transactions on Pattern Analysis',
          tags: ['machine learning', 'computer vision', 'neural networks']
        }
      },
      {
        id: 'pub_002',
        type: 'publication',
        title: 'Sustainable Energy Systems: A Comprehensive Review',
        content: 'A comprehensive analysis of sustainable energy systems and their implementation in modern infrastructure.',
        metadata: {
          author: 'Dr. Lisa Wang',
          year: 2022,
          publicationType: 'Conference Paper',
          department: 'Electrical Engineering',
          conference: 'International Conference on Renewable Energy',
          tags: ['sustainable energy', 'renewable energy', 'infrastructure']
        }
      }
    );

    // Sample photo data
    this.mockData.push(
      {
        id: 'photo_001',
        type: 'photo',
        title: 'Graduation Ceremony 2023',
        content: 'Annual graduation ceremony held at the main campus auditorium.',
        metadata: {
          year: 2023,
          collection: 'Graduation Photos',
          photographer: 'Campus Photography Team',
          location: 'Main Campus Auditorium',
          tags: ['graduation', 'ceremony', '2023', 'campus']
        },
        thumbnail: '/images/graduation-2023-thumb.jpg'
      },
      {
        id: 'photo_002',
        type: 'photo',
        title: 'Research Lab Opening',
        content: 'Opening ceremony of the new AI Research Laboratory.',
        metadata: {
          year: 2023,
          collection: 'Campus Events',
          photographer: 'Research Team',
          location: 'AI Research Lab',
          tags: ['research', 'ai', 'laboratory', 'opening']
        },
        thumbnail: '/images/lab-opening-thumb.jpg'
      }
    );

    // Sample faculty data
    this.mockData.push(
      {
        id: 'faculty_001',
        type: 'faculty',
        title: 'Dr. Robert Anderson',
        content: 'Professor of Computer Science, specializing in artificial intelligence and machine learning research.',
        metadata: {
          name: 'Dr. Robert Anderson',
          department: 'Computer Science',
          position: 'Professor',
          specialization: 'Artificial Intelligence',
          email: 'r.anderson@university.edu',
          tags: ['professor', 'ai', 'machine learning', 'computer science']
        }
      },
      {
        id: 'faculty_002',
        type: 'faculty',
        title: 'Dr. Emily Rodriguez',
        content: 'Associate Professor of Electrical Engineering, focusing on renewable energy systems and smart grid technology.',
        metadata: {
          name: 'Dr. Emily Rodriguez',
          department: 'Electrical Engineering',
          position: 'Associate Professor',
          specialization: 'Renewable Energy Systems',
          email: 'e.rodriguez@university.edu',
          tags: ['professor', 'renewable energy', 'smart grid', 'electrical engineering']
        }
      }
    );
  }

  async initialize(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to load real CSV data
    if (!this.realDataLoaded) {
      try {
        await this.loadRealAlumniData();
        this.realDataLoaded = true;
      } catch (error) {
        console.warn('Could not load real alumni data, using mock data:', error);
      }
    }
    
    this.browserInitialized = true;
  }

  async close(): Promise<void> {
    this.browserInitialized = false;
  }

  isConnected(): boolean {
    return this.browserInitialized;
  }

  // Mock search functionality
  async searchMockData(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
    if (!this.browserInitialized) {
      throw new Error('Database not initialized');
    }

    // Debug logging
    console.log('[BrowserDatabaseManager] searchMockData called with:', {
      query,
      filters,
      hasQuery: query.length > 0,
      activeFilters: Object.keys(filters).filter(k => filters[k as keyof SearchFilters])
    });

    console.log('[BrowserDatabaseManager] Starting with', this.mockData.length, 'total items');

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const hasQuery = searchTerms.length > 0;
    
    // STEP 1: Apply filters FIRST (before query matching)
    let results = this.mockData.filter(item => {
      // Type filter
      if (filters.type && item.type !== filters.type) {
        return false;
      }
      
      // Year filter (exact year)
      if (filters.year && item.metadata.year !== filters.year) {
        return false;
      }
      
      // Department filter
      if (filters.department && item.metadata.department !== filters.department) {
        return false;
      }
      
      // Year range filter
      if (filters.yearRange) {
        const itemYear = item.metadata.year;
        if (itemYear && (itemYear < filters.yearRange.start || itemYear > filters.yearRange.end)) {
          return false;
        }
      }
      
      // Name filter
      if (filters.name) {
        const nameQuery = filters.name.toLowerCase();
        const nameFields = [
          item.title,
          item.metadata.name,
          item.metadata.firstName,
          item.metadata.lastName
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!nameFields.includes(nameQuery)) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log('[BrowserDatabaseManager] After applying filters:', results.length, 'items remain');
    
    // STEP 2: If no query, return filtered results (filter-only browsing)
    if (!hasQuery) {
      console.log('[BrowserDatabaseManager] No query provided, returning filter-only results');
      // Skip to scoring and return
      const scoredResults = results.map(item => {
        return {
          id: item.id,
          type: item.type,
          title: item.title,
          snippet: this.generateSnippet(item.content, []),
          relevanceScore: 1.0,
          score: 1.0,
          metadata: item.metadata,
          thumbnail: item.thumbnail,
          thumbnailPath: item.thumbnail,
          data: this.createDataRecord(item)
        } as SearchResult;
      });
      
      console.log('[BrowserDatabaseManager] Returning', scoredResults.length, 'filter-only results');
      return scoredResults;
    }
    
    // STEP 3: Apply query matching to filtered results
    results = results.filter(item => {
      // Enhanced text search - check multiple fields
      const searchableFields = [
        item.title,
        item.content,
        item.metadata.name,
        item.metadata.firstName,
        item.metadata.lastName,
        item.metadata.department,
        item.metadata.currentPosition,
        item.metadata.tags?.join(' ')
      ].filter(Boolean).join(' ').toLowerCase();

      // Check if any search term matches
      const matchesQuery = searchTerms.every(term => {
        // Each term must match somewhere in the searchable text
        return searchableFields.includes(term);
      });
      
      return matchesQuery;
    });

    console.log('[BrowserDatabaseManager] After query matching:', results.length, 'items remain');
    
    // Log which filters/query eliminated results
    if (results.length === 0) {
      if (filters.type || filters.year || filters.department || filters.yearRange || filters.name) {
        console.warn('[BrowserDatabaseManager] Filters and/or query eliminated all results. Active filters:', {
          type: filters.type,
          year: filters.year,
          department: filters.department,
          yearRange: filters.yearRange,
          name: filters.name
        }, 'Query:', query);
      } else {
        console.warn('[BrowserDatabaseManager] Query eliminated all results:', query);
      }
    }

    // Calculate relevance scores
    const scoredResults = results.map(item => {
      let score = 0;
      
      searchTerms.forEach(term => {
        // Exact name match gets highest score
        if (item.title.toLowerCase() === query.toLowerCase()) {
          score += 2.0;
        }
        // Full name contains term (high priority)
        else if (item.title.toLowerCase().includes(term)) {
          score += 1.5;
        }
        // First or last name match
        if (item.metadata.firstName?.toLowerCase() === term || 
            item.metadata.lastName?.toLowerCase() === term) {
          score += 1.2;
        }
        // Name contains term
        if (item.metadata.name?.toLowerCase().includes(term)) {
          score += 1.0;
        }
        // Department match
        if (item.metadata.department?.toLowerCase().includes(term)) {
          score += 0.6;
        }
        // Position/role match
        if (item.metadata.currentPosition?.toLowerCase().includes(term)) {
          score += 0.5;
        }
        // Content matches get lower score
        if (item.content.toLowerCase().includes(term)) {
          score += 0.3;
        }
        // Tag matches
        if (item.metadata.tags?.some((tag: string) => tag.toLowerCase().includes(term))) {
          score += 0.4;
        }
      });

      // Normalize score (but allow high scores for exact matches)
      score = Math.min(score / searchTerms.length, 2.0);

      return {
        id: item.id,
        type: item.type,
        title: item.title,
        snippet: this.generateSnippet(item.content, searchTerms),
        relevanceScore: score,
        score, // For UI compatibility
        metadata: item.metadata,
        thumbnail: item.thumbnail,
        thumbnailPath: item.thumbnail,
        data: this.createDataRecord(item)
      } as SearchResult;
    });

    // Sort by relevance score
    scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    console.log('[BrowserDatabaseManager] Returning', scoredResults.length, 'scored and sorted results');

    return scoredResults;
  }

  private generateSnippet(content: string, searchTerms: string[]): string {
    const maxLength = 150;
    
    // Find the first occurrence of any search term
    let startIndex = 0;
    for (const term of searchTerms) {
      const index = content.toLowerCase().indexOf(term);
      if (index !== -1) {
        startIndex = Math.max(0, index - 50);
        break;
      }
    }

    let snippet = content.substring(startIndex, startIndex + maxLength);
    
    // Ensure we don't cut off in the middle of a word
    if (startIndex > 0) {
      const firstSpace = snippet.indexOf(' ');
      if (firstSpace > 0) {
        snippet = snippet.substring(firstSpace + 1);
      }
      snippet = '...' + snippet;
    }

    if (startIndex + maxLength < content.length) {
      const lastSpace = snippet.lastIndexOf(' ');
      if (lastSpace > 0) {
        snippet = snippet.substring(0, lastSpace);
      }
      snippet = snippet + '...';
    }

    return snippet;
  }

  // Provide access to mock data for other components
  getMockData(): MockDataItem[] {
    return [...this.mockData];
  }

  // Add method to add more mock data if needed
  addMockData(items: MockDataItem[]): void {
    this.mockData.push(...items);
  }

  // Load real alumni data from CSV
  private async loadRealAlumniData(): Promise<void> {
    try {
      const response = await fetch('/sample-alumni.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch alumni CSV');
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      
      // Clear mock data and replace with real data
      this.mockData = [];
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (simple parsing - may need improvement for complex cases)
        const parts = line.split(',');
        if (parts.length < 7) continue;
        
        const firstName = parts[0]?.trim() || '';
        const middleName = parts[1]?.trim() || '';
        const lastName = parts[2]?.trim() || '';
        const classRole = parts[3]?.trim() || '';
        const gradYear = parseInt(parts[4]?.trim() || '0');
        const photoFile = parts[6]?.trim() || '';
        
        if (!firstName && !lastName) continue;
        
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
        const id = `alumni_real_${i}`;
        
        // Create alumni item
        const alumniItem: MockDataItem = {
          id,
          type: 'alumni',
          title: fullName,
          content: classRole ? `${classRole}, Class of ${gradYear}` : `Class of ${gradYear}`,
          metadata: {
            name: fullName,
            firstName,
            middleName,
            lastName,
            year: gradYear,
            classYear: gradYear.toString(),
            department: 'Law', // Default for this dataset
            currentPosition: classRole || 'Alumni',
            role: classRole,
            photoFile: photoFile || '',
            tags: [classRole, gradYear.toString(), 'law', 'alumni'].filter(Boolean)
          },
          thumbnail: photoFile || undefined
        };
        
        this.mockData.push(alumniItem);
      }
      
      console.log(`Loaded ${this.mockData.length} alumni records from CSV`);
    } catch (error) {
      console.error('Error loading real alumni data:', error);
      throw error;
    }
  }

  // Create properly structured data record for SearchResult
  private createDataRecord(item: MockDataItem): any {
    switch (item.type) {
      case 'alumni':
        return {
          id: item.id,
          full_name: item.title,
          first_name: item.metadata.firstName || '',
          middle_name: item.metadata.middleName || '',
          last_name: item.metadata.lastName || '',
          grad_year: item.metadata.year || 2020,
          class_year: item.metadata.year || 2020,
          grad_date: `${item.metadata.year || 2020}-05-15`,
          class_role: item.metadata.role || '',
          role: item.metadata.currentPosition || item.metadata.role || '',
          photo_file: item.metadata.photoFile || item.thumbnail || '',
          portrait_path: item.thumbnail || '',
          composite_image_path: '',
          decade: `${Math.floor((item.metadata.year || 2020) / 10) * 10}s`,
          caption: item.content,
          tags: item.metadata.tags || [],
          sort_key: item.title.toLowerCase()
        };

      case 'publication':
        return {
          id: parseInt(item.id.replace('pub_', '')),
          title: item.title,
          pub_name: item.metadata.publicationType || 'Journal Article',
          issue_date: `${item.metadata.year}-01-01`,
          volume_issue: `Vol. ${item.metadata.year}`,
          pdf_path: `/publications/${item.id}.pdf`,
          thumb_path: item.thumbnail,
          description: item.content,
          tags: item.metadata.tags?.join(', ') || ''
        };

      case 'photo':
        return {
          id: parseInt(item.id.replace('photo_', '')),
          collection: item.metadata.collection || 'General',
          title: item.title,
          year_or_decade: item.metadata.year?.toString() || '2020',
          image_path: item.thumbnail || `/photos/${item.id}.jpg`,
          caption: item.content,
          tags: item.metadata.tags?.join(', ') || ''
        };

      case 'faculty':
        return {
          id: parseInt(item.id.replace('faculty_', '')),
          full_name: item.title,
          title: item.metadata.position || 'Professor',
          department: item.metadata.department || 'General',
          email: item.metadata.email || '',
          phone: item.metadata.phone || '',
          headshot_path: item.thumbnail || `/faculty/${item.id}.jpg`
        };

      default:
        return {};
    }
  }
}