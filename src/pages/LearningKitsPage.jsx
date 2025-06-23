import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Filter, 
  Search, 
  Grid, 
  List,
  SortAsc,
  Heart,
  Package,
  Star,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import LearningKitCard from '@/components/LearningKitCard';
import { 
  getAllLearningKits, 
  getKitCategories, 
  searchLearningKits 
} from '@/lib/learningKitService';

const LearningKitsPage = () => {
  const { toast } = useToast();
  const [kits, setKits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    kitType: '',
    category: '',
    priceRange: [0, 10000],
    minRating: 0,
    inStock: false,
    sortBy: 'popularity_score',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadKits();
    loadCategories();
  }, [filters]);

  const loadKits = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllLearningKits(filters);
      if (error) throw error;
      setKits(data || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลชุดการเรียนรู้ได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await getKitCategories();
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadKits();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await searchLearningKits(searchTerm);
      if (error) throw error;
      setKits(data || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถค้นหาได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      kitType: '',
      category: '',
      priceRange: [0, 10000],
      minRating: 0,
      inStock: false,
      sortBy: 'popularity_score',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  const handleAddToCart = (kit) => {
    // TODO: Implement cart functionality
    toast({
      title: "เพิ่มในตะกร้าแล้ว! 🛒",
      description: `${kit.kit_name} ถูกเพิ่มในตะกร้าสินค้า`
    });
  };

  const handleViewDetails = (kit) => {
    // TODO: Navigate to kit detail page
    console.log('View kit details:', kit);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const kitTypes = [
    { value: '', label: 'ทุกประเภท' },
    { value: 'hardware', label: 'ฮาร์ดแวร์' },
    { value: 'software', label: 'ซอฟต์แวร์' },
    { value: 'mixed', label: 'ผสม' },
    { value: 'materials', label: 'วัสดุการเรียน' }
  ];

  const sortOptions = [
    { value: 'popularity_score', label: 'ความนิยม' },
    { value: 'price', label: 'ราคา' },
    { value: 'created_at', label: 'วันที่เพิ่ม' },
    { value: 'kit_name', label: 'ชื่อสินค้า' }
  ];

  return (
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants}
      className="container mx-auto px-4 py-12"
    >
      <Helmet>
        <title>ชุดการเรียนรู้ - Login Learning</title>
        <meta name="description" content="ชุดการเรียนรู้และอุปกรณ์สำหรับคอร์สเรียนทั้งหมด" />
      </Helmet>

      {/* Header */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
          <ShoppingBag className="inline-block w-10 h-10 mr-3 text-[#667eea]" />
          ชุดการเรียนรู้
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          อุปกรณ์และชุดการเรียนรู้ที่ออกแบบมาเพื่อใช้ประกอบการเรียนในคอร์สต่างๆ
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-effect p-6 rounded-xl mb-8"
      >
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="ค้นหาชุดการเรียนรู้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
          <Button onClick={handleSearch} className="bg-[#667eea] hover:bg-[#5a6fcf]">
            ค้นหา
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-600 text-slate-300"
            >
              <Sliders className="w-4 h-4 mr-2" />
              ตัวกรอง
            </Button>

            {/* Quick Filters */}
            <select
              value={filters.kitType}
              onChange={(e) => handleFilterChange('kitType', e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
            >
              {kitTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-slate-300"
            >
              <SortAsc className={`w-4 h-4 ${filters.sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-400 hover:text-white"
            >
              ล้างตัวกรอง
            </Button>
            
            <div className="flex border border-slate-600 rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none border-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-6 pt-6 border-t border-slate-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">หมวดหมู่</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="">ทุกหมวดหมู่</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">ช่วงราคา</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={filters.priceRange[0]}
                    onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 10000])}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">คะแนนขั้นต่ำ</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', parseInt(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value={0}>ทุกคะแนน</option>
                  <option value={4}>4 ดาวขึ้นไป</option>
                  <option value={3}>3 ดาวขึ้นไป</option>
                  <option value={2}>2 ดาวขึ้นไป</option>
                  <option value={1}>1 ดาวขึ้นไป</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">สถานะสินค้า</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-white text-sm">เฉพาะที่มีสินค้า</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results */}
      <div className="mb-6 text-slate-400">
        ผลการค้นหา: {kits.length} รายการ
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto mb-4"></div>
          <p className="text-slate-400">กำลังโหลดชุดการเรียนรู้...</p>
        </div>
      )}

      {/* Kit Grid */}
      {!loading && kits.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}
        >
          {kits.map((kit, index) => (
            <motion.div
              key={kit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <LearningKitCard
                kit={kit}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
                isInWishlist={false} // TODO: Check actual wishlist status
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && kits.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-24 h-24 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">ไม่พบชุดการเรียนรู้</h3>
          <p className="text-slate-400 mb-4">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          <Button onClick={clearFilters} variant="outline">
            ล้างตัวกรอง
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LearningKitsPage;