import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '@/styles/swiper-custom.css'; // Assuming you will create this file

const CourseSlider = ({
  courses = [],
  autoplay: enableAutoplay = false,
  showNavigation = true,
  showPagination = true,
  slidesPerView = { mobile: 1, tablet: 2, desktop: 3 }
}) => {
  if (!courses || courses.length === 0) {
    return <div>No courses to display.</div>;
  }

  const breakpoints = {
    320: {
      slidesPerView: slidesPerView.mobile,
      spaceBetween: 10
    },
    768: {
      slidesPerView: slidesPerView.tablet,
      spaceBetween: 20
    },
    1024: {
      slidesPerView: slidesPerView.desktop,
      spaceBetween: 30
    }
  };

  return (
    <div className="course-slider">
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        spaceBetween={30}
        slidesPerView={slidesPerView.desktop}
        navigation={showNavigation}
        pagination={{ clickable: true, el: showPagination ? '.swiper-pagination' : null }}
        autoplay={enableAutoplay ? { delay: 3000, disableOnInteraction: false } : false}
        breakpoints={breakpoints}
        grabCursor={true}
        loop={true}
      >
        {courses.map((course) => (
          <SwiperSlide key={course.id}>
            {/* Replace with your actual CourseCard component */}
            <div className="p-4 border rounded-lg">
              <img src={course.image || '/images/placeholder.png'} alt={course.title} className="w-full h-48 object-cover mb-4 rounded" />
              <h3 className="text-lg font-bold">{course.title}</h3>
              <p className="text-gray-600">{course.description}</p>
            </div>
          </SwiperSlide>
        ))}
        {showPagination && <div className="swiper-pagination"></div>}
      </Swiper>
    </div>
  );
};

export default CourseSlider;