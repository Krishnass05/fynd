// The domains the platform supports and the sub-topics in each, for the "Services" menu.
// Taken from the team's Job_counts list (domains and their most common topics). OWNER: Krishna.
// `name` matches the category written on freelancer profiles and jobs so the menu can filter by it.
export interface ServiceDomain {
  name: string;
  topics: string[];
}

export const SERVICES: ServiceDomain[] = [
  {
    name: 'Websites, IT and Software',
    topics: ['PHP', 'HTML', 'Web Development', 'Digital Marketing', 'SEO', 'JavaScript', 'WordPress', 'Python', 'API Development', 'eCommerce'],
  },
  {
    name: 'Design, Media and Architecture',
    topics: ['Graphic Design', 'Video Editing', 'Website Design', 'Photoshop', 'After Effects', 'Animation', '3D Modelling', 'Logo Design', 'Illustration', 'Photography'],
  },
  { name: 'Engineering and Science', topics: ['AutoCAD', 'CAD/CAM'] },
  { name: 'Business, Accounting, Human Resources and Legal', topics: ['Data Analysis', 'Project Management', 'Business Development', 'Database Management'] },
  { name: 'Data Entry and Admin', topics: ['Data Entry', 'Excel', 'Data Processing', 'Customer Service'] },
];
