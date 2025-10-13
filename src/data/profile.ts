export type Publication = {
  title: string
  authors: string
  venue: string
  year?: string
  links?: { label: string, href: string }[]
  image?: string
  lab?: string
  labUrl?: string
  status?: "in_progress" | "under_review" | "accepted"
}

export type Project = {
  title: string
  description: string
  tags: string[]
  href?: string
}

export type Education = {
  institution: string
  degree: string
  field: string
  period: string
  gpa?: string
  coursework?: string[]
  achievements?: string[]
  links?: { label: string, href: string }[]
}

export type Experience = {
  company: string
  position: string
  location: string
  period: string
  description: string
  achievements?: string[]
  tags?: string[]
}

export const profile = {
  name: "Kunal Aneja",
  tagline: "Research Engineer • RL • VLA • Robotics",
  location: "Atlanta, GA",
  email: "kunala@gatech.edu",
  socials: {
    github: "https://github.com/Kunal2341",
    scholar: "https://scholar.google.com/citations?user=Faop3qAAAAAJ&hl=en",
    linkedin: "https://www.linkedin.com/in/kunal-aneja/",
    twitter: "https://x.com/Kunal_101a65"
  },
  publications: [
    {
      title: "I2G2RO: Image to Grasp to Reorient",
      authors: "Kunal Aneja, ..., Animesh Garg",
      venue: "Projected RSS 2026",
      image: "/i2g2ro_vid.gif",
      status: "in_progress",
      lab: "PAIR Lab",
      labUrl: "https://www.pair.toronto.edu/",
      links: [
        { label: "Website", href: "https://github.com/pairlab/IsaacLab/" }
      ]
    },
    {
      title: "AMPLIFY: Actionless Motion Priors for Robot Learning from Videos",
      authors: "Jeremy A. Collins*, Loránd Cheng*, Kunal Aneja, Albert Wilcox, Benjamin Joffe, Animesh Garg",
      venue: "ICRA 2025",
      image: "/amplify_vid.mp4",
      lab: "PAIR Lab",
      labUrl: "https://www.pair.toronto.edu/",
      links: [
        { label: "Website", href: "https://amplify-robotics.github.io/" },
        { label: "arXiv", href: "https://arxiv.org/abs/2402.18660" },
        { label: "Code", href: "https://github.com/pairlab/AMPLIFY" }
      ]
    },
    {
      title: "FLASH: Flow-Based Language-Annotated Grasp Synthesis for Dexterous Hands",
      authors: "Hrish Leen, Jeremy A. Collins, Kunal Aneja, Nhi Nguyen, Priyadarshini Tamilselvan, Sri Siddarth Chakaravarthy P, Animesh Garg",
      venue: "CoRL 2025 Workshop",
      image: "/flash_vid.gif",
      lab: "PAIR Lab",
      labUrl: "https://www.pair.toronto.edu/",
      links: [
        { label: "PDF", href: "/flash_paper.pdf" },
        { label: "Code", href: "https://github.com/pairlab/LC-Grasp" }
      ]
    },
    {
      title: "A Survey of Grasping for Dexterous Robot Hands",
      authors: "Hrishit Leen*, Kunal Aneja*, Chetan Reddy, Priyadarshini Tamilselvan, Sri Siddarth Chakaravarthy, Nhi Nguyen, Jeremy Collins, Miroslav Bogdanovic, Animesh Garg",
      venue: "Advanced Robotics Journal 2025",
      image: "/survey_img.png",
      lab: "PAIR Lab",
      labUrl: "https://www.pair.toronto.edu/",
      links: [
        { label: "Website", href: "https://www.pair.toronto.edu/DexRobotGraspSurvey.github.io/" },
        { label: "Paper", href: "/survey_paper.pdf" },
        { label: "Evaluation Code", href: "https://github.com/pairlab/GraspEval" }
      ]
    },
    {
      title: "PressureVision++: Estimating Fingertip Pressure from Diverse RGB Images",
      authors: "Patrick Grady, Jeremy A. Collins, Chengcheng Tang, Christopher D. Twigg, Kunal Aneja, James Hays, Charles C. Kemp",
      venue: "WACV 2024",
      image: "/pressurevision_vid.gif",
      lab: "HRL Lab",
      labUrl: "https://www.hrl.gatech.edu/",
      links: [
        { label: "Website", href: "https://pressurevision.github.io/" },
        { label: "Paper", href: "https://arxiv.org/abs/2301.02310" },
        { label: "Code/Data", href: "https://github.com/pressurevision/pressurevision" }
      ]
    }
  ] as Publication[],
  projects: [
    {
      title: "LEAP Hand PAIR Integration",
      description: "Integration work with LEAP Hand robotic platform for PAIR Lab research. Implemented Python API and ROS modules for controlling the anthropomorphic robotic hand.",
      tags: ["Python", "ROS", "Robotics", "Hardware Control", "PAIR Lab"],
      href: "https://github.com/Kunal2341/LEAP_Hand_PAIR"
    },
    {
      title: "Dungeon Adventure Game (Android)",
      description: "Multi-room dungeon adventure game for Android with character selection, difficulty levels, and dynamic enemy AI. Built with MVVM architecture and comprehensive testing.",
      tags: ["Android", "Java", "MVVM", "Game Development", "Testing"],
      href: "https://github.com/Kunal2341/CS2340B_Team15"
    },
    {
      title: "Hand Pose Estimation Algorithm Comparison",
      description: "Comprehensive evaluation of hand pose estimation models including Google MediaPipe, MMPose, and AlphaPose. Tested 100+ hand images with various augmentation techniques.",
      tags: ["Python", "Computer Vision", "MediaPipe", "MMPose", "Pose Estimation"],
      href: "https://github.com/Kunal2341/HandPosesAlgorithm"
    }
  ] as Project[],
  education: [
    {
      institution: "Georgia Institute of Technology",
      degree: "Master of Science",
      field: "Machine Learning (Robotics)",
      period: "Aug 2025 - May 2026",
      gpa: "4.0",
      coursework: ["Deep Reinforcement Learning", "Vision-Language Models", "Formal Methods of Reinforcement Learning"]
    },
    {
      institution: "Georgia Institute of Technology",
      degree: "Bachelor of Science",
      field: "Computer Science",
      period: "Aug 2022 - Aug 2025",
      gpa: "4.0 (Major GPA)",
      coursework: ["Deep Learning", "Computer Vision", "Machine Learning"],
      achievements: ["Dean's List 2022 - 2025", "Best Paper Award - Deep Learning (300 students)"]
    }
  ] as Education[],
  experience: [
    {
      company: "Amazon Web Services",
      position: "Software Development Engineer Intern",
      location: "Seattle, WA",
      period: "May 2024 – Aug 2024",
      description: "Glue Data Catalog & Lake Formation",
      achievements: [
        "Reduced metadata lookup latency by 15% by redesigning caching path for partition keys in C++",
        "Implemented encryption-defaults workflow adopted service-wide for new Lake Formation tables"
      ],
      tags: ["C++", "AWS", "Data Engineering", "Performance Optimization", "Lake Formation"]
    }
  ] as Experience[],
  skills: ["Reinforcement Learning", "Vision-Language Action Models", "World Models", "Manipulation", "Sim-to-Real", "IsaacLab", "Behavior Cloning"]
}
