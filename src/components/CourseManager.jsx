/**
 * CourseManager - Course and Instructor Management Component
 * 
 * Features:
 * - Draggable courses and instructors
 * - Course creation and management
 * - Instructor assignment
 * - Search and filter functionality
 * - Integration with ScheduleGrid for drag & drop
 */

import React, { useState, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { 
  Plus, 
  Search, 
  BookOpen, 
  User, 
  GripVertical,
  Edit3,
  Trash2,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../hooks/use-toast'
import { getCourses, createCourse, updateCourse, deleteCourse } from '../lib/teachingScheduleService'

// Drag & Drop Types (matching ScheduleGrid)
const ItemTypes = {
  COURSE: 'course',
  INSTRUCTOR: 'instructor'
}

// Company options - ใช้ชื่อสั้น
const companies = [
  { id: 'login', name: 'Login', color: '#1e3a8a' }, // น้ำเงินเข้ม
  { id: 'meta', name: 'Meta', color: '#7c3aed' }, // ม่วง
  { id: 'med', name: 'Med', color: '#10b981' },
  { id: 'edtech', name: 'EdTech', color: '#8b5cf6' },
  { id: 'innotech', name: 'Innotech', color: '#f97316' },
  { id: 'w2d', name: 'W2D', color: '#ef4444' }
]

// ===================================================================
// DRAGGABLE COURSE COMPONENT
// ===================================================================

const DraggableCourse = ({ course, instructor, onEdit, onDelete }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.COURSE,
    item: () => {
      console.log('🔄 DraggableCourse: Creating drag item:', {
        courseName: course?.name,
        courseId: course?.id,
        instructor: instructor?.full_name,
        type: ItemTypes.COURSE
      })
      
      return { 
        course, 
        instructor,
        type: ItemTypes.COURSE 
      }
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      console.log('🏁 DraggableCourse: Drag ended:', {
        courseName: course?.name,
        didDrop: monitor.didDrop(),
        dropResult
      })
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  return (
    <div
      ref={dragPreview}
      className={`bg-white border rounded-lg p-3 shadow-sm transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:shadow-md'
      }`}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-between mb-2">
        <div 
          ref={drag}
          className="flex items-center gap-2 cursor-move p-1 rounded hover:bg-gray-100"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900 truncate">
            {course.name || course.title}
          </span>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(course)}
            className="p-1 rounded hover:bg-gray-100"
            title="แก้ไข"
          >
            <Edit3 className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={() => onDelete(course.id)}
            className="p-1 rounded hover:bg-gray-100"
            title="ลบ"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>

      {/* Course Code */}
      {course.code && (
        <div className="text-xs text-gray-600 mb-2">
          {course.code}
        </div>
      )}

      {/* Company */}
      <div className="text-xs text-gray-600 mb-2">
        {companies.find(c => c.id === course.company)?.name || course.company}
      </div>

      {/* Instructor */}
      {instructor && (
        <div className="flex items-center gap-1 text-xs text-gray-700 mb-2">
          <User className="w-3 h-3" />
          <span className="truncate">{instructor.full_name || instructor.name}</span>
        </div>
      )}

      {/* Course Details */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{course.default_duration || 1}h</span>
        </div>
        
        {course.default_room && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{course.default_room}</span>
          </div>
        )}
      </div>

      {/* Color Indicator */}
      <div 
        className="mt-2 h-2 rounded"
        style={{ backgroundColor: course.color || '#3B82F6' }}
      ></div>
    </div>
  )
}

// ===================================================================
// COURSE CREATE/EDIT MODAL
// ===================================================================

const CourseModal = ({ isOpen, onClose, course, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [colorSource, setColorSource] = useState('company')
  
  // Extended location data (like original system)
  const locations = [
    { id: 'sriracha', name: 'ศรีราชา', color: '#2563eb' }, // สีน้ำเงิน
    { id: 'rayong', name: 'ระยอง', color: '#0ea5e9' }, // สีฟ้า
    { id: 'ladkrabang', name: 'ลาดกระบัง', color: '#ea580c' }, // สีส้ม
    { id: 'bangplad', name: 'บางพลัด', color: '#be185d' }, // สีเลือดหมู
    { id: 'online', name: 'Online', color: '#10b981' }, // สีเขียว
    { id: 'hybrid', name: 'Hybrid', color: '#8b5cf6' } // สีม่วง
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.target)
      
      // Get selected company and location
      const selectedCompany = companies.find(c => c.id === formData.get('company'))
      const selectedLocation = locations.find(l => l.id === formData.get('location'))
      
      // Determine color based on colorSource
      const colorSourceValue = formData.get('colorSource')
      let finalColor = '#3b82f6' // default
      
      if (colorSourceValue === 'company' && selectedCompany?.color) {
        finalColor = selectedCompany.color
      } else if (colorSourceValue === 'location' && selectedLocation?.color) {
        finalColor = selectedLocation.color
      }
      
      const courseData = {
        name: formData.get('name'),
        description: `คอร์สสอนโดย ${selectedCompany?.name || ''} ที่ ${selectedLocation?.name || ''}`,
        company: selectedCompany?.name || '', // Full company name
        company_id: selectedCompany?.id || '', // Company ID for filtering  
        location: selectedLocation?.name || '',
        location_id: selectedLocation?.id || '', // Location ID
        company_color: finalColor, // สีที่เลือกตาม colorSource
        duration_hours: parseInt(formData.get('duration')) || 1
      }
      
      console.log('🔄 CourseModal: Calling onSave with data:', courseData)
      await onSave(courseData)
      onClose()
    } catch (error) {
      console.error('❌ CourseModal: Error saving course:', error)
      // Don't close modal if there's an error
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {course ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}
            </h3>
            <p className="text-sm text-gray-600">กำหนดรายละเอียดคอร์สสอนใหม่</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              ชื่อวิชา
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={course?.name || ''}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800"
              placeholder="เช่น การเขียนโปรแกรมเบื้องต้น"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                บริษัท
              </label>
              <select
                name="company"
                defaultValue={course ? companies.find(c => c.name === course.company)?.id || '' : ''}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 bg-white"
                required
              >
                <option value="" className="bg-white text-gray-800">เลือกบริษัท</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id} className="bg-white text-gray-800">
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                ศูนย์/สถานที่
              </label>
              <select
                name="location"
                defaultValue={course ? locations.find(l => l.name === course.location)?.id || '' : ''}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 bg-white"
                required
              >
                <option value="" className="bg-white text-gray-800">เลือกศูนย์</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id} className="bg-white text-gray-800">
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              ระยะเวลา (ชั่วโมง)
            </label>
            <select
              name="duration"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 bg-white"
              defaultValue={course?.duration_hours || 1}
            >
              <option value={1}>1 ชั่วโมง</option>
              <option value={2}>2 ชั่วโมง</option>
              <option value={3}>3 ชั่วโมง</option>
              <option value={4}>4 ชั่วโมง</option>
            </select>
          </div>

          {/* Color Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              เลือกสีตาม
            </label>
            <div className="space-y-4">
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="colorSource"
                    value="company"
                    defaultChecked={course ? 
                      companies.some(c => c.name === course.company && c.color === course.company_color) : 
                      true
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">สีตามบริษัท</span>
                </label>
                <div className="ml-7 mt-2 flex space-x-3">
                  {companies.map(company => (
                    <div key={company.id} className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: company.color }}
                        title={company.name}
                      ></div>
                      <span className="text-xs text-gray-600 mt-1">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="colorSource"
                    value="location"
                    defaultChecked={course ? 
                      locations.some(l => l.name === course.location && l.color === course.company_color) : 
                      false
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">สีตามสถานที่</span>
                </label>
                <div className="ml-7 mt-2 flex space-x-3">
                  {locations.map(location => (
                    <div key={location.id} className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: location.color }}
                        title={location.name}
                      ></div>
                      <span className="text-xs text-gray-600 mt-1">{location.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md disabled:opacity-50 transition-all"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : (course ? 'แก้ไข' : 'เพิ่ม')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===================================================================
// DRAGGABLE INSTRUCTOR COMPONENT
// ===================================================================

const DraggableInstructor = ({ instructor, onEdit, onRemove }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.INSTRUCTOR,
    item: () => {
      console.log('🚀 DraggableInstructor: Drag started!', {
        instructorName: instructor?.full_name,
        instructorId: instructor?.user_id,
        type: ItemTypes.INSTRUCTOR
      })
      
      return { 
        instructor,
        type: ItemTypes.INSTRUCTOR
      }
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      console.log('🏁 DraggableInstructor: Drag ended:', {
        didDrop: monitor.didDrop(),
        dropResult,
        instructorName: instructor?.full_name
      })
    },
    collect: (monitor) => {
      const collecting = {
        isDragging: monitor.isDragging()
      }
      
      if (collecting.isDragging) {
        console.log('🎭 DraggableInstructor: Currently dragging:', instructor?.full_name)
      }
      
      return collecting
    }
  })

  return (
    <div
      ref={dragPreview}
      className={`bg-white border rounded-lg p-3 shadow-sm transition-all duration-200 ${
        isDragging ? 'opacity-30 scale-95 rotate-3 z-50' : 'opacity-100 hover:shadow-md hover:scale-[1.02]'
      }`}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-between mb-2">
        <div 
          ref={drag}
          className="flex items-center gap-2 cursor-move p-2 rounded hover:bg-green-100 border-2 border-dashed border-transparent hover:border-green-300 transition-all"
          title="ลากเพื่อย้ายผู้สอน"
        >
          <GripVertical className="w-4 h-4 text-green-500" />
          <User className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900 truncate">
            {instructor.full_name || instructor.email || 'ไม่ระบุชื่อ'}
          </span>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onEdit && onEdit(instructor)}
            className="p-1 rounded hover:bg-gray-100"
            title="แก้ไข"
          >
            <Edit3 className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={() => onRemove && onRemove(instructor.user_id)}
            className="p-1 rounded hover:bg-gray-100"
            title="ลบ"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>

      {/* Instructor Details */}
      <div className="text-xs text-gray-600 mb-2">
        {instructor.email}
      </div>

      {/* Role Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
          {instructor.role === 'admin' ? 'ผู้ดูแลระบบ' : 'อาจารย์'}
        </span>
        
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Active</span>
        </div>
      </div>

      {/* Color Indicator */}
      <div 
        className="mt-2 h-2 rounded"
        style={{ backgroundColor: '#10B981' }}
      ></div>
    </div>
  )
}

// ===================================================================
// MAIN COURSE MANAGER COMPONENT
// ===================================================================

const CourseManager = ({ company = 'login' }) => {
  const { toast } = useToast()
  
  // State
  const [courses, setCourses] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [instructorSearchTerm, setInstructorSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  
  // Collapse/Expand states
  const [coursesCollapsed, setCoursesCollapsed] = useState(false)
  const [instructorsCollapsed, setInstructorsCollapsed] = useState(false)

  // Load courses and instructors
  useEffect(() => {
    loadData()
  }, [company])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load courses using service
      const { data: coursesData, error: coursesError } = await getCourses()
      
      if (coursesError) {
        throw new Error(coursesError)
      }

      // Fix: Don't filter by company for now - show all courses
      // The issue is company mismatch: prop='login' vs course.company='Login Learning'
      let filteredCourses = coursesData || []
      
      // TODO: Later add proper company filtering when we have company_id column
      // if (company) {
      //   const companyConfig = companies.find(c => c.id === company)
      //   const companyName = companyConfig?.name
      //   
      //   filteredCourses = coursesData.filter(course => {
      //     return course.company === companyName
      //   })
      // }
        
      console.log('📊 CourseManager loadData:', {
        totalCourses: coursesData?.length || 0,
        filteredCourses: filteredCourses?.length || 0,
        filterCompany: company,
        companyName: companies.find(c => c.id === company)?.name,
        allCourses: coursesData?.map(c => ({ name: c.name, company: c.company }))
      })

      // Load instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .neq('role', 'student')
        .eq('is_active', true)
        .order('full_name')

      if (instructorsError) throw instructorsError

      setCourses(filteredCourses || [])
      setInstructors(instructorsData || [])
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter courses based on search
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.company && course.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (course.location && course.location.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Filter instructors based on search
  const filteredInstructors = instructors.filter(instructor =>
    (instructor.full_name && instructor.full_name.toLowerCase().includes(instructorSearchTerm.toLowerCase())) ||
    (instructor.email && instructor.email.toLowerCase().includes(instructorSearchTerm.toLowerCase()))
  )

  // Handle course save
  const handleSaveCourse = async (courseData) => {
    try {
      console.log('💾 CourseManager: Starting save operation:', courseData)
      
      if (editingCourse) {
        // Update existing course using service
        console.log('✏️ Updating course:', editingCourse.id)
        const { data, error } = await updateCourse(editingCourse.id, courseData)
        
        if (error) {
          console.error('❌ Update course error:', error)
          throw new Error(error)
        }

        console.log('✅ Course updated successfully:', data)
        toast({
          title: "แก้ไขคอร์สสำเร็จ",
          description: `แก้ไข ${courseData.name} แล้ว`
        })
      } else {
        // Create new course using service
        console.log('➕ Creating new course')
        const { data, error } = await createCourse(courseData)
        
        if (error) {
          console.error('❌ Create course error:', error)
          throw new Error(error)
        }

        console.log('✅ Course created successfully:', data)
        toast({
          title: "เพิ่มคอร์สสำเร็จ",
          description: `เพิ่ม ${courseData.name} แล้ว`
        })
      }

      console.log('🔄 Reloading course data...')
      await loadData()
      console.log('✅ Course data reloaded')
      
    } catch (error) {
      console.error('💥 CourseManager: Save error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกคอร์สได้",
        variant: "destructive"
      })
      throw error
    }
  }

  // Handle course delete
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('คุณต้องการลบคอร์สนี้หรือไม่?')) return

    try {
      const { error } = await deleteCourse(courseId)
      
      if (error) throw new Error(error)

      toast({
        title: "ลบคอร์สสำเร็จ",
        description: "ลบคอร์สแล้ว"
      })

      await loadData()
    } catch (error) {
      console.error('Error deleting course:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบคอร์สได้",
        variant: "destructive"
      })
    }
  }

  // Handle edit
  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setModalOpen(true)
  }

  // Handle add new
  const handleAddCourse = () => {
    setEditingCourse(null)
    setModalOpen(true)
  }

  // Handle instructor management
  const handleEditInstructor = (instructor) => {
    // Could open instructor edit modal
    console.log('Edit instructor:', instructor)
    toast({
      title: "แก้ไขผู้สอน",
      description: `แก้ไข ${instructor.full_name || instructor.email}`
    })
  }

  const handleRemoveInstructor = async (instructorId) => {
    if (!window.confirm('คุณต้องการลบผู้สอนคนนี้หรือไม่?')) return

    try {
      // In a real app, you might want to deactivate instead of delete
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('user_id', instructorId)
      
      if (error) throw error

      toast({
        title: "ลบผู้สอนสำเร็จ",
        description: "ลบผู้สอนแล้ว"
      })

      await loadData()
    } catch (error) {
      console.error('Error removing instructor:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบผู้สอนได้",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">กำลังโหลด...</span>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Course Section - Horizontal Layout */}
        <div className="border-b">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCoursesCollapsed(!coursesCollapsed)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={coursesCollapsed ? "แสดงคอร์ส" : "ซ่อนคอร์ส"}
                >
                  {coursesCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">คอร์สสำหรับลากไปวางตาราง</h3>
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {filteredCourses.length} คอร์ส
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!coursesCollapsed && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="ค้นหาคอร์ส..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                    />
                  </div>
                )}
                <button
                  onClick={handleAddCourse}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มคอร์ส
                </button>
              </div>
            </div>
          </div>

          {/* Course List - Horizontal Scrollable Cards */}
          {!coursesCollapsed && (
            <div className="p-4">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 w-full">
                  {searchTerm ? 'ไม่พบคอร์สที่ตรงกับการค้นหา' : 'ยังไม่มีคอร์ส'}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  {filteredCourses.map((course) => {
                    // Find default instructor for this course (could be enhanced)
                    const defaultInstructor = instructors[0] // Simplified - could be course-specific
                    
                    console.log('🎨 Rendering course for drag:', {
                      id: course.id,
                      name: course.name,
                      company: course.company,
                      instructor: defaultInstructor?.full_name,
                      dragType: ItemTypes.COURSE
                    })
                    
                    return (
                      <div key={course.id} className="flex-shrink-0" style={{ minWidth: '280px' }}>
                        <DraggableCourse
                          course={course}
                          instructor={defaultInstructor}
                          onEdit={handleEditCourse}
                          onDelete={handleDeleteCourse}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructor Section - Horizontal Layout */}
        <div>
          {/* Header */}
          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInstructorsCollapsed(!instructorsCollapsed)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={instructorsCollapsed ? "แสดงผู้สอน" : "ซ่อนผู้สอน"}
                >
                  {instructorsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                <User className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">ผู้สอนในระบบ</h3>
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {filteredInstructors.length} คน
                </span>
              </div>
              {!instructorsCollapsed && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="ค้นหาผู้สอน..."
                    value={instructorSearchTerm}
                    onChange={(e) => setInstructorSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Instructor List - Horizontal Scrollable Cards */}
          {!instructorsCollapsed && (
            <div className="p-4">
              {filteredInstructors.length === 0 ? (
                <div className="text-center py-8 text-gray-500 w-full">
                  {instructorSearchTerm ? 'ไม่พบผู้สอนที่ตรงกับการค้นหา' : 'ยังไม่มีผู้สอน'}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                  {filteredInstructors.map((instructor) => (
                    <div key={instructor.user_id} className="flex-shrink-0" style={{ minWidth: '200px' }}>
                      <DraggableInstructor
                        instructor={instructor}
                        onEdit={handleEditInstructor}
                        onRemove={handleRemoveInstructor}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Usage Instructions - Only show when not collapsed */}
          {!instructorsCollapsed && (
            <div className="px-4 pb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">💡 วิธีใช้งาน:</p>
                    <p className="text-blue-800">ลากคอร์สและผู้สอนไปวางในตารางเพื่อสร้างตารางสอน - สะดวกและรวดเร็ว!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Outside the grid */}
      <CourseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCourse(null)
        }}
        course={editingCourse}
        onSave={handleSaveCourse}
      />
    </>
  )
}

export default CourseManager