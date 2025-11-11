import { AlumniRecord, PublicationRecord, PhotoRecord, FacultyRecord } from "@/types";

// Sample alumni data (representing the CSV structure)
export const sampleAlumni: AlumniRecord[] = [
  {
    id: "alum_1980_001",
    first_name: "Carmen",
    middle_name: "",
    last_name: "Castilla",
    full_name: "Carmen Castilla",
    class_role: "Law Review Editor-in-Chief",
    grad_year: 1980,
    grad_date: "1980-05-15",
    photo_file: "1-Carmen_Castilla-Law_Review_Editor_In_Chief.jpg",
    composite_image_path: "alumni/1980/composite_1980.jpg",
    portrait_path: "alumni/1980/portraits/1-Carmen_Castilla-Law_Review_Editor_In_Chief.jpg",
    sort_key: "Castilla, Carmen",
    decade: "1980s",
    tags: ["1980s", "leadership", "law review editor-in-chief"]
  },
  {
    id: "alum_1985_002",
    first_name: "Michael",
    middle_name: "J",
    last_name: "Rodriguez",
    full_name: "Michael J Rodriguez",
    class_role: "Class President",
    grad_year: 1985,
    grad_date: "1985-05-18",
    composite_image_path: "alumni/1985/composite_1985.jpg",
    sort_key: "Rodriguez, Michael",
    decade: "1980s",
    tags: ["1980s", "leadership", "class president"]
  },
  {
    id: "alum_1990_003",
    first_name: "Jennifer",
    last_name: "Chen",
    full_name: "Jennifer Chen",
    grad_year: 1990,
    grad_date: "1990-05-20",
    composite_image_path: "alumni/1990/composite_1990.jpg",
    sort_key: "Chen, Jennifer",
    decade: "1990s",
    tags: ["1990s"]
  },
  {
    id: "alum_1995_004",
    first_name: "David",
    middle_name: "Alan",
    last_name: "Thompson",
    full_name: "David Alan Thompson",
    class_role: "Student Bar Association President",
    grad_year: 1995,
    grad_date: "1995-05-21",
    composite_image_path: "alumni/1995/composite_1995.jpg",
    sort_key: "Thompson, David",
    decade: "1990s",
    tags: ["1990s", "leadership", "student bar association president"]
  },
  {
    id: "alum_2000_005",
    first_name: "Sarah",
    last_name: "Williams",
    full_name: "Sarah Williams",
    grad_year: 2000,
    grad_date: "2000-05-14",
    composite_image_path: "alumni/2000/composite_2000.jpg",
    sort_key: "Williams, Sarah",
    decade: "2000s",
    tags: ["2000s"]
  },
  {
    id: "alum_2005_006",
    first_name: "James",
    last_name: "Anderson",
    full_name: "James Anderson",
    class_role: "Moot Court Board Chair",
    grad_year: 2005,
    grad_date: "2005-05-15",
    composite_image_path: "alumni/2005/composite_2005.jpg",
    sort_key: "Anderson, James",
    decade: "2000s",
    tags: ["2000s", "leadership", "moot court board chair"]
  },
  {
    id: "alum_2010_007",
    first_name: "Maria",
    last_name: "Garcia",
    full_name: "Maria Garcia",
    grad_year: 2010,
    grad_date: "2010-05-16",
    composite_image_path: "alumni/2010/composite_2010.jpg",
    sort_key: "Garcia, Maria",
    decade: "2010s",
    tags: ["2010s"]
  },
  {
    id: "alum_2015_008",
    first_name: "Robert",
    middle_name: "Lee",
    last_name: "Jackson",
    full_name: "Robert Lee Jackson",
    class_role: "Class Vice President",
    grad_year: 2015,
    grad_date: "2015-05-17",
    composite_image_path: "alumni/2015/composite_2015.jpg",
    sort_key: "Jackson, Robert",
    decade: "2010s",
    tags: ["2010s", "leadership", "class vice president"]
  }
];

export const samplePublications: PublicationRecord[] = [
  {
    id: "amicus_2023_fall",
    title: "Amicus - Fall 2023",
    pub_name: "Amicus",
    issue_date: "2023-09-01",
    volume_issue: "Vol. 45, Issue 1",
    pdf_path: "/sample-publication.pdf",
    thumb_path: "publications/amicus/2023-09/cover.jpg",
    description: "Fall semester highlights, faculty achievements, and student spotlights",
    tags: ["newsletter", "fall", "2023"],
    page_count: 24,
    year: 2023,
    decade: "2020s"
  },
  {
    id: "law_review_2022_v1",
    title: "Law Review - 2022 Volume 1",
    pub_name: "Law Review",
    issue_date: "2022-03-01",
    volume_issue: "Vol. 44, Issue 1",
    pdf_path: "/sample-publication.pdf",
    thumb_path: "publications/law-review/2022/v1_cover.jpg",
    description: "Scholarly articles on constitutional law, civil procedure, and legal ethics",
    tags: ["academic", "journal", "2022"],
    page_count: 156,
    year: 2022,
    decade: "2020s"
  },
  {
    id: "legal_eye_2021_spring",
    title: "Legal Eye - Spring 2021",
    pub_name: "Legal Eye",
    issue_date: "2021-04-01",
    volume_issue: "Spring 2021",
    pdf_path: "/sample-publication.pdf",
    thumb_path: "publications/legal-eye/2021-spring/cover.jpg",
    description: "Student-run newspaper featuring campus news and legal commentary",
    tags: ["newspaper", "student", "2021"],
    page_count: 16,
    year: 2021,
    decade: "2020s"
  },
  {
    id: "composite_1994_1995",
    title: "Class Composite 1994-1995",
    pub_name: "Directory",
    issue_date: "1995-05-01",
    volume_issue: "1994-1995",
    flipbook_path: "/flipbooks/composite-1994-1995/index.html",
    description: "Class composite for the 1994-1995 academic year",
    tags: ["composite", "directory", "1994", "1995"],
    year: 1995,
    decade: "1990s"
  }
];

export const samplePhotos: PhotoRecord[] = [
  {
    id: "photo_founding_001",
    collection: "Founding Era",
    title: "Original Campus Building - 1978",
    year_or_decade: "1970s",
    image_path: "photos/collections/founding/campus_1978.jpg",
    caption: "The original law school building on opening day, showcasing the distinctive architecture that would become iconic",
    tags: ["founding", "campus", "architecture", "1970s"],
    rights_note: "MC Archives"
  },
  {
    id: "photo_1990s_001",
    collection: "1990s Campus Life",
    title: "Student Lounge Gathering",
    year_or_decade: "1990s",
    image_path: "photos/collections/1990s/student_lounge.jpg",
    caption: "Students gathering in the renovated student lounge during exam week",
    tags: ["student life", "campus", "1990s"],
    rights_note: "MC Archives"
  },
  {
    id: "photo_events_001",
    collection: "Notable Events",
    title: "Commencement 2015",
    year_or_decade: "2015",
    image_path: "photos/collections/events/commencement_2015.jpg",
    caption: "Graduating class of 2015 receives their diplomas on a beautiful spring day",
    tags: ["commencement", "graduation", "ceremony", "2015"],
    rights_note: "MC Archives"
  }
];

export const sampleFaculty: FacultyRecord[] = [
  {
    id: "faculty_jsmith",
    full_name: "Dr. John Smith",
    title: "Professor of Constitutional Law",
    department: "Constitutional Law",
    email: "j.smith@mc.edu",
    phone: "(555) 123-4567",
    sort_key: "Smith, John"
  },
  {
    id: "faculty_mjohnson",
    full_name: "Prof. Maria Johnson",
    title: "Associate Professor of Criminal Law",
    department: "Criminal Law",
    email: "m.johnson@mc.edu",
    phone: "(555) 123-4568",
    sort_key: "Johnson, Maria"
  },
  {
    id: "faculty_rwilliams",
    full_name: "Dr. Robert Williams",
    title: "Dean and Professor of Civil Procedure",
    department: "Administration",
    email: "r.williams@mc.edu",
    phone: "(555) 123-4500",
    sort_key: "Williams, Robert"
  }
];

// Utility function to build search index
export function buildAlumniSearchIndex(records: AlumniRecord[]) {
  return records.map(record => ({
    id: record.id,
    searchText: `${record.full_name} ${record.class_role || ''}`.toLowerCase(),
    grad_year: record.grad_year,
    decade: record.decade,
    has_photo: !!record.portrait_path,
    record: record
  }));
}
