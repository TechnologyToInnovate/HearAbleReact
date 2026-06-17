/* data.js
   Our mock database. This holds the state of the application. 
   When backend integration happens, these arrays will be populated by fetching from an API.
*/

// Constant simulating the active company session
const CURRENT_LOGGED_IN_COMPANY = "Tech Solutions Inc."; 

let jobsData = [
    {
        id: 1, 
        title: "Frontend Developer",
        company: "Tech Solutions Inc.",
        location: "Manila, Philippines",
        type: "Full-time",
        date: "March 8, 2026",
        description: "We are looking for a talented Frontend Developer to join our team. You will be responsible for building responsive web applications using modern technologies.",
        skills: ["React.js experience", "TypeScript knowledge", "CSS/Tailwind proficiency", "Git version control"],
        companyBio: "Tech Solutions Inc. is a trusted SDEAS partner company committed to providing opportunities for graduates.",
        applied: true 
    },
    {
        id: 2,
        title: "Backend Developer",
        company: "Digital Innovations",
        location: "Quezon City, Philippines",
        type: "Full-time",
        date: "March 10, 2026",
        description: "Join our backend team to build scalable APIs and microservices for our enterprise clients. You will work closely with frontend developers and product managers.",
        skills: ["Node.js", "Express", "MongoDB", "AWS deployment"],
        companyBio: "Digital Innovations is a leading tech agency specializing in enterprise-grade software and cloud solutions.",
        applied: false 
    }
];

let applicationsData = [
    {
        id: 101,
        applicantName: "David Lee",
        initials: "DL",
        jobTitle: "Mobile App Developer",
        company: "Tech Solutions Inc.",
        date: "3/13/2026",
        skills: ["React Native", "JavaScript", "iOS", "+2"],
        status: "Pending"
    },
    {
        id: 102,
        applicantName: "Anna Lim",
        initials: "AL",
        jobTitle: "Frontend Developer",
        company: "Tech Solutions Inc.",
        date: "3/12/2026",
        skills: ["React", "JavaScript", "CSS3", "+2"],
        status: "Reviewing"
    }
];

let graduatesData = [
    { id: 201, name: "David Lee", initials: "DL", batch: "Batch 2025", course: "BS Computer Science", status: "Active" },
    { id: 202, name: "Anna Lim", initials: "AL", batch: "Batch 2025", course: "BS Information Technology", status: "Active" },
    { id: 203, name: "Juan Dela Cruz", initials: "JD", batch: "Batch 2026", course: "BS Information Systems", status: "Pending" }
];

let companiesData = [
    { 
        id: 301, 
        name: "Tech Solutions Inc.", 
        location: "Manila, Philippines", 
        jobsPosted: 5, 
        status: "Active",
        industry: "Software Development",
        website: "www.techsolutions.com",
        bio: "Tech Solutions Inc. is a trusted SDEAS partner company committed to providing opportunities for graduates."
    },
    { 
        id: 302, 
        name: "Digital Innovations", 
        location: "Quezon City, Philippines", 
        jobsPosted: 2, 
        status: "Active",
        industry: "Cloud Infrastructure",
        website: "www.digitalinnovations.ph",
        bio: "Digital Innovations is a leading tech agency specializing in enterprise-grade software and cloud solutions."
    },
    { 
        id: 303, 
        name: "Creative Studios", 
        location: "Makati, Philippines", 
        jobsPosted: 0, 
        status: "Pending", 
        industry: "Design & UX", 
        website: "", 
        bio: "" 
    }
];

// Profile data for the currently logged in user
let userProfileData = {
    fullName: "John Graduate",
    email: "graduate@test.com",
    phone: "+1234567890",
    location: "Manila, Philippines",
    headline: "Mobile Software Engineer specializing in .NET MAUI & C#"
};

export { jobsData, graduatesData, companiesData };