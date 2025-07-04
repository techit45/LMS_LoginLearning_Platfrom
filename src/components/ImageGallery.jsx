import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';
import '@/styles/swiper-custom.css';

const ImageGallery = ({
  images = [],
  showThumbnails = true,
  allowZoom = true
}) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  if (!images || images.length === 0) {
    return <div>No images to display.</div>;
  }

  return (
    <div className="image-gallery">
      <Swiper
        modules={[Navigation, Thumbs, A11y]}
        spaceBetween={10}
        navigation
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        grabCursor={true}
        loop={true}
        className="main-gallery"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <img
              src={image.src || image}
              alt={image.alt || `Gallery image ${index + 1}`}
              className={`${allowZoom ? 'cursor-zoom-in' : ''}`}
              onClick={() => allowZoom && window.open(image.src || image, '_blank')}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {showThumbnails && (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs, FreeMode, A11y]}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          className="thumbnails-gallery mt-4"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index} className="cursor-pointer">
              <img
                src={image.thumb || image.src || image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-auto object-cover rounded"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

export default ImageGallery;