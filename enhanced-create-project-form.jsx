// ส่วนเพิ่มเติมสำหรับ CreateProjectForm ที่รองรับฟิลด์ใหม่

/* เพิ่มในส่วน form หลังจาก Title และ Description */

{/* Short Description */}
<div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-xl border border-sky-200">
  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
    <div className="bg-sky-500 p-2 rounded-lg mr-3">
      <FileText className="w-4 h-4 text-white" />
    </div>
    คำอธิบายสั้น
  </label>
  <Input
    name="short_description"
    value={formData.short_description}
    onChange={handleInputChange}
    placeholder="คำอธิบายสั้นๆ สำหรับแสดงในการ์ดโครงงาน"
    className="bg-white border-gray-300 text-gray-800 focus:border-sky-500 focus:ring-sky-500 rounded-xl shadow-sm"
  />
</div>

{/* Technologies */}
<div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
  <label className="block text-gray-800 font-semibold mb-4 flex items-center">
    <div className="bg-purple-500 p-2 rounded-lg mr-3">
      <Layers className="w-4 h-4 text-white" />
    </div>
    เทคโนโลยีที่ใช้
  </label>
  
  <div className="flex space-x-2 mb-3">
    <Input
      value={newTechnology}
      onChange={(e) => setNewTechnology(e.target.value)}
      placeholder="เช่น React, Node.js, MongoDB"
      className="flex-1 bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500 rounded-xl shadow-sm"
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTechnology();
        }
      }}
    />
    <Button
      type="button"
      onClick={addTechnology}
      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4"
    >
      <Plus className="w-4 h-4" />
    </Button>
  </div>
  
  {formData.technologies.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {formData.technologies.map((tech, index) => (
        <span
          key={index}
          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm flex items-center"
        >
          {tech}
          <button
            type="button"
            onClick={() => removeTechnology(tech)}
            className="ml-2 text-purple-600 hover:text-purple-800"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  )}
</div>

{/* Tags */}
<div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200">
  <label className="block text-gray-800 font-semibold mb-4 flex items-center">
    <div className="bg-pink-500 p-2 rounded-lg mr-3">
      <Tag className="w-4 h-4 text-white" />
    </div>
    แท็ก
  </label>
  
  <div className="flex space-x-2 mb-3">
    <Input
      value={newTag}
      onChange={(e) => setNewTag(e.target.value)}
      placeholder="เช่น beginner, web-development, full-stack"
      className="flex-1 bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500 rounded-xl shadow-sm"
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTag();
        }
      }}
    />
    <Button
      type="button"
      onClick={addTag}
      className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-4"
    >
      <Plus className="w-4 h-4" />
    </Button>
  </div>
  
  {formData.tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {formData.tags.map((tag, index) => (
        <span
          key={index}
          className="bg-pink-100 text-pink-800 px-3 py-1 rounded-lg text-sm flex items-center"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-2 text-pink-600 hover:text-pink-800"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  )}
</div>

{/* Category, Difficulty, Duration - Grid Layout */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Category */}
  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
    <label className="block text-gray-800 font-semibold mb-3 flex items-center">
      <div className="bg-orange-500 p-2 rounded-lg mr-3">
        <Tag className="w-4 h-4 text-white" />
      </div>
      หมวดหมู่ *
    </label>
    <select
      name="category"
      value={formData.category}
      onChange={handleInputChange}
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-orange-500 focus:ring-orange-500 shadow-sm"
    >
      <option value="">เลือกหมวดหมู่</option>
      <option value="Web Development">Web Development</option>
      <option value="Mobile App">Mobile App</option>
      <option value="IoT">IoT</option>
      <option value="AI/ML">AI/ML</option>
      <option value="Game Development">Game Development</option>
      <option value="Data Science">Data Science</option>
      <option value="Hardware">Hardware</option>
      <option value="Other">อื่นๆ</option>
    </select>
    {errors.category && (
      <p className="text-red-600 text-sm mt-2 flex items-center">
        <AlertCircle className="w-4 h-4 mr-2" />
        {errors.category}
      </p>
    )}
  </div>

  {/* Difficulty */}
  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
    <label className="block text-gray-800 font-semibold mb-3 flex items-center">
      <div className="bg-emerald-500 p-2 rounded-lg mr-3">
        <Star className="w-4 h-4 text-white" />
      </div>
      ระดับความยาก
    </label>
    <select
      name="difficulty_level"
      value={formData.difficulty_level}
      onChange={handleInputChange}
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm"
    >
      <option value="beginner">เริ่มต้น</option>
      <option value="intermediate">ปานกลาง</option>
      <option value="advanced">ขั้นสูง</option>
    </select>
  </div>

  {/* Duration */}
  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
    <label className="block text-gray-800 font-semibold mb-3 flex items-center">
      <div className="bg-indigo-500 p-2 rounded-lg mr-3">
        <Calendar className="w-4 h-4 text-white" />
      </div>
      ระยะเวลา (ชั่วโมง)
    </label>
    <Input
      name="duration_hours"
      type="number"
      value={formData.duration_hours}
      onChange={handleInputChange}
      placeholder="เช่น 40"
      min="1"
      className="bg-white border-gray-300 text-gray-800 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm"
    />
  </div>
</div>

{/* URLs Section */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Project URL */}
  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
    <label className="block text-gray-800 font-semibold mb-3 flex items-center">
      <div className="bg-cyan-500 p-2 rounded-lg mr-3">
        <Globe className="w-4 h-4 text-white" />
      </div>
      ลิงก์โครงงาน
    </label>
    <Input
      name="project_url"
      type="url"
      value={formData.project_url}
      onChange={handleInputChange}
      placeholder="https://example.com"
      className="bg-white border-gray-300 text-gray-800 focus:border-cyan-500 focus:ring-cyan-500 rounded-xl shadow-sm"
    />
  </div>

  {/* GitHub URL */}
  <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
    <label className="block text-gray-800 font-semibold mb-3 flex items-center">
      <div className="bg-gray-700 p-2 rounded-lg mr-3">
        <Github className="w-4 h-4 text-white" />
      </div>
      ลิงก์ GitHub
    </label>
    <Input
      name="github_url"
      type="url"
      value={formData.github_url}
      onChange={handleInputChange}
      placeholder="https://github.com/username/repo"
      className="bg-white border-gray-300 text-gray-800 focus:border-gray-500 focus:ring-gray-500 rounded-xl shadow-sm"
    />
  </div>

  {/* Video URL */}
  <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
    <label className="block text-gray-800 font-semibold mb-3 flex items-center">
      <div className="bg-red-500 p-2 rounded-lg mr-3">
        <Play className="w-4 h-4 text-white" />
      </div>
      ลิงก์วิดีโอ
    </label>
    <Input
      name="video_url"
      type="url"
      value={formData.video_url}
      onChange={handleInputChange}
      placeholder="https://youtube.com/watch?v=..."
      className="bg-white border-gray-300 text-gray-800 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm"
    />
  </div>
</div>

{/* Cover Image URL */}
<div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-200">
  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
    <div className="bg-violet-500 p-2 rounded-lg mr-3">
      <ImageIcon className="w-4 h-4 text-white" />
    </div>
    ลิงก์รูปหน้าปก
  </label>
  <Input
    name="cover_image_url"
    type="url"
    value={formData.cover_image_url}
    onChange={handleInputChange}
    placeholder="https://example.com/image.jpg"
    className="bg-white border-gray-300 text-gray-800 focus:border-violet-500 focus:ring-violet-500 rounded-xl shadow-sm"
  />
</div>

{/* HTML Content */}
<div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
    <div className="bg-amber-500 p-2 rounded-lg mr-3">
      <FileText className="w-4 h-4 text-white" />
    </div>
    เนื้อหาเพิ่มเติม (HTML)
  </label>
  <textarea
    name="content_html"
    value={formData.content_html}
    onChange={handleInputChange}
    placeholder="เนื้อหาเพิ่มเติมในรูปแบบ HTML..."
    rows={6}
    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-amber-500 focus:ring-amber-500 text-base shadow-sm resize-none font-mono"
  />
</div>

{/* Status and Featured */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Status */}
  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
    <label className="block text-gray-800 font-semibold mb-3 flex items-center">
      <div className="bg-teal-500 p-2 rounded-lg mr-3">
        <Calendar className="w-4 h-4 text-white" />
      </div>
      สถานะ
    </label>
    <select
      name="status"
      value={formData.status}
      onChange={handleInputChange}
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-teal-500 focus:ring-teal-500 shadow-sm"
    >
      <option value="draft">ร่าง</option>
      <option value="published">เผยแพร่</option>
      <option value="archived">เก็บถาวร</option>
    </select>
  </div>

  {/* Featured */}
  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        name="is_featured"
        checked={formData.is_featured}
        onChange={handleInputChange}
        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
      />
      <div className="ml-3 flex items-center">
        <div className="bg-yellow-500 p-2 rounded-lg mr-3">
          <Star className="w-4 h-4 text-white" />
        </div>
        <span className="text-gray-800 font-semibold">โครงงานแนะนำ (Featured)</span>
      </div>
    </label>
  </div>
}