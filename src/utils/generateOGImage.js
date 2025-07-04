// Simple OG Image generator for Login Learning
// This creates HTML-based social preview images

export const generateOGImageHTML = (title, description, type = 'website') => {
  const gradients = {
    homepage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    about: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    courses: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    projects: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    dashboard: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  const gradient = gradients[type] || gradients.default;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                width: 1200px;
                height: 630px;
                background: ${gradient};
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                color: white;
                position: relative;
                overflow: hidden;
            }
            .container {
                max-width: 900px;
                padding: 60px;
                z-index: 2;
            }
            .logo {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 40px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .title {
                font-size: 64px;
                font-weight: bold;
                margin-bottom: 30px;
                line-height: 1.2;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .description {
                font-size: 28px;
                line-height: 1.4;
                opacity: 0.9;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            .decoration {
                position: absolute;
                width: 200px;
                height: 200px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                top: -100px;
                right: -100px;
            }
            .decoration2 {
                position: absolute;
                width: 150px;
                height: 150px;
                border-radius: 50%;
                background: rgba(255,255,255,0.05);
                bottom: -75px;
                left: -75px;
            }
        </style>
    </head>
    <body>
        <div class="decoration"></div>
        <div class="decoration2"></div>
        <div class="container">
            <div class="logo">🎓 Login Learning</div>
            <div class="title">${title}</div>
            <div class="description">${description}</div>
        </div>
    </body>
    </html>
  `;
};

export const ogImageConfigs = {
  homepage: {
    title: 'แพลตฟอร์มเรียนรู้วิศวกรรม',
    description: 'ช่วยน้องมัธยมค้นพบศักยภาพและความชอบด้านวิศวกรรม',
    type: 'homepage'
  },
  about: {
    title: 'เกี่ยวกับเรา',
    description: 'ทีมงานผู้เชี่ยวชาญ 4 สาขา พร้อมช่วยน้องๆ ค้นหาเส้นทางอนาคต',
    type: 'about'
  },
  courses: {
    title: 'คอร์สเรียนทั้งหมด',
    description: 'เรียนรู้จากโครงงานจริง พร้อมพี่เลี้ยงผู้เชี่ยวชาญ',
    type: 'courses'
  },
  projects: {
    title: 'โครงงานและผลงาน',
    description: 'ชมผลงานนักเรียน สร้างสรรค์ด้วยเทคโนโลยีทันสมัย',
    type: 'projects'
  },
  dashboard: {
    title: 'แดชบอร์ด',
    description: 'จัดการคอร์สเรียน โปรไฟล์ และติดตามความคืบหน้า',
    type: 'dashboard'
  }
};

// For static images, we'll create placeholder info
export const ogImagePaths = {
  homepage: '/images/og-homepage.jpg',
  about: '/images/og-about.jpg',
  courses: '/images/og-courses.jpg',
  projects: '/images/og-projects.jpg',
  dashboard: '/images/og-dashboard.jpg',
  courseDefault: '/images/og-course-default.jpg',
  projectDefault: '/images/og-project-default.jpg',
  default: '/images/og-default.jpg'
};