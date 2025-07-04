import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import '@/styles/swiper-custom.css';

const StarRating = ({ rating }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  );
};

const TestimonialSlider = ({
  testimonials = [],
  autoplay = true,
  delay = 5000,
  showRating = true
}) => {
  if (!testimonials || testimonials.length === 0) {
    return <div>No testimonials to display.</div>;
  }

  return (
    <div className="testimonial-slider">
      <Swiper
        modules={[Pagination, A11y, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={autoplay ? { delay, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
        loop={true}
        grabCursor={true}
        breakpoints={{
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
      >
        {testimonials.map((testimonial) => (
          <SwiperSlide key={testimonial.id}>
            <div className="p-6 border rounded-lg bg-white shadow-sm h-full flex flex-col">
              <div className="flex-grow">
                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
              </div>
              <div className="flex items-center mt-4">
                <img
                  src={testimonial.avatar || '/images/profile.png'}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.course}</p>
                  {showRating && <StarRating rating={testimonial.rating} />}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default TestimonialSlider;