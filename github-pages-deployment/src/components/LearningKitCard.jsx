import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Package, 
  Truck, 
  Award,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { addToWishlist, removeFromWishlist } from '@/lib/learningKitService';

const LearningKitCard = ({ kit, onAddToCart, onViewDetails, isInWishlist = false }) => {
  const { toast } = useToast();
  const [inWishlist, setInWishlist] = useState(isInWishlist);
  const [loading, setLoading] = useState(false);

  const handleWishlistToggle = async () => {
    setLoading(true);
    try {
      if (inWishlist) {
        const { error } = await removeFromWishlist(kit.id);
        if (error) throw error;
        
        setInWishlist(false);
        toast({
          title: "ลบออกจากรายการที่ถูกใจแล้ว",
          description: `${kit.kit_name} ถูกลบออกจากรายการที่ถูกใจ`
        });
      } else {
        const { error } = await addToWishlist(kit.id);
        if (error) throw error;
        
        setInWishlist(true);
        toast({
          title: "เพิ่มในรายการที่ถูกใจแล้ว",
          description: `${kit.kit_name} ถูกเพิ่มในรายการที่ถูกใจ`
        });
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-slate-400" />
      );
    }

    return stars;
  };

  const getStockStatus = () => {
    if (kit.stock_quantity === 0) {
      return { text: 'สินค้าหมด', color: 'text-red-400', bg: 'bg-red-500/20' };
    } else if (kit.stock_quantity <= 5) {
      return { text: `เหลือ ${kit.stock_quantity} ชิ้น`, color: 'text-orange-400', bg: 'bg-orange-500/20' };
    } else {
      return { text: 'มีสินค้า', color: 'text-green-400', bg: 'bg-green-500/20' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-effect rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={kit.featured_image_url || '/api/placeholder/400/300'}
          alt={kit.kit_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlays */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {kit.original_price && kit.original_price > kit.price && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              ลด {Math.round(((kit.original_price - kit.price) / kit.original_price) * 100)}%
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
            {stockStatus.text}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlistToggle}
            disabled={loading}
            className={`rounded-full ${inWishlist ? 'text-red-400 bg-red-500/20' : 'text-slate-400 bg-black/20'} hover:bg-black/40`}
          >
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(kit)}
              className="bg-white/90 text-slate-900 hover:bg-white"
            >
              <Eye className="w-4 h-4 mr-1" />
              ดูรายละเอียด
            </Button>
            {kit.stock_quantity > 0 && (
              <Button
                size="sm"
                onClick={() => onAddToCart(kit)}
                className="bg-[#667eea] hover:bg-[#5a6fcf]"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                เพิ่มในตะกร้า
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Course */}
        <div className="mb-3">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-2">
            {kit.kit_name}
          </h3>
          {kit.courses && (
            <p className="text-slate-400 text-sm flex items-center">
              <Package className="w-3 h-3 mr-1" />
              สำหรับคอร์ส: {kit.courses.title}
            </p>
          )}
        </div>

        {/* Rating */}
        {kit.review_count > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {renderStars(kit.average_rating)}
            </div>
            <span className="text-slate-400 text-sm">
              ({kit.review_count} รีวิว)
            </span>
          </div>
        )}

        {/* Kit Type & Features */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
            {kit.kit_type === 'hardware' ? 'ฮาร์ดแวร์' : 
             kit.kit_type === 'software' ? 'ซอฟต์แวร์' : 
             kit.kit_type === 'mixed' ? 'ผสม' : 'วัสดุการเรียน'}
          </span>
          {kit.is_digital && (
            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
              <ExternalLink className="w-3 h-3 inline mr-1" />
              ดิจิทัล
            </span>
          )}
          {kit.warranty_months > 0 && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
              <Award className="w-3 h-3 inline mr-1" />
              รับประกัน {kit.warranty_months} เดือน
            </span>
          )}
        </div>

        {/* Shipping Info */}
        {kit.requires_shipping && (
          <div className="flex items-center text-slate-400 text-sm mb-3">
            <Truck className="w-4 h-4 mr-1" />
            จัดส่งภายใน {kit.estimated_delivery_days} วัน
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                {formatPrice(kit.price)}
              </span>
              {kit.original_price && kit.original_price > kit.price && (
                <span className="text-slate-400 text-sm line-through">
                  {formatPrice(kit.original_price)}
                </span>
              )}
            </div>
            {kit.is_digital && (
              <span className="text-green-400 text-xs">ไม่มีค่าจัดส่ง</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={() => onAddToCart(kit)}
            disabled={kit.stock_quantity === 0}
            className="bg-[#667eea] hover:bg-[#5a6fcf] disabled:opacity-50"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default LearningKitCard;