import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight,
  PlayCircle, 
  FileText, 
  CheckCir
  XCircle,
  Clock, 
  Users,
  BookOpen,
  Downloa
  Troph,
  Lock,
  AlertCircle,
  CheckSquare,
  MessageSquare,
  Send,
  Heart,
  Settings,
  Share,
  Wrench,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import QuizPlayer from '@/components/QuizPlayer';
import AssignmentPlayer from '@/components/AssignmentPlayer';
import QuickQuizSetup from '@/components/QuickQuizSetup';
import QuickAssignmentSetup from '@/components/QuickAssignmentSetup';
import { useAuth } from '@/contexts/AuthContext';
import { getCourseById } from '@/lib/courseService';
import {
import { getQuizByCo
import { getAssignmentice';
import { isUserEnrolle;
import { 
  getCourseContentWithProgress,
  checkContentAccessibility
} from '@/lib/progressManagementService';
import { 
  checkCity,
  getCourseContentAccessibility 
} from '@/lib/contentLockSer;
import AttachmentViewer from '@/component;
import Cents';

const CourseLearningPage = () =>
  const { courseId } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Course and content state
  const [course, setCourse] = useSt
  const [loading, setLoading] = useStarue);
  const [enrollmentStatus, setEe });
);
  const [enrollmentId, setEnr);
  const [contentAccessibility, setContentAcce);
  
  // Current content state
  const [selectedConte;
  conll);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeAssignment, setActiveAssignment] = useStatll);
  const [showAssignment, setShowAssignment] = useState(false);
  
  // Admin setup modals
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [showAssignmentSetup, setShowAssignmentSetup]lse);

  const loadCourseProgress = useCallback(async () => {
    if (!courseId) return;

    try {
      const { data, error } = await getUserCourseProgress(co;
      
{
        console.error('Error loading course progress:', error);
        return;
      }
      
      if (data) {
        setCoursedata);
      }
    } catch (err
      coor);

  }, [courseId]);

  const checkEnrollmentAndProgress = useCallback(async () => {

    try {
      console.log('Checking enrollment for user:', user?ourseId);
      
      // Check enrollment
      const { isEnrolled, status, err;
      console.log('Enrollment res);
      
      if (error) {
        consoler);
       oast({
้",
          description: error.message,
tive"
        });
        setEnrollmentStatus({ isEn);
        return;
      }
      
      setEnrollmentStatus({ isEnrol);
      
      /esponse

        setEnrollmentId
        console.log('Enrollment ID set:', status.enrollment_id);
d) {
        setEnrollmentId(status.id);
        console.log('Enrollment ID set from status.id:', status.id);
      }

 {
        console.log('User is e);
        
        // Load co progress
        aw);

        // Load course
        const { data: courseContentDa;
        if (courseContentData && cour
          console.l);
          
 service
          const { accessibility, error: accessError } = ad);
          if (accessError) {
            console.error('Error loading content accessibility:', arror);
          } else {
            console.log('🔒 Content accessibility loaded:', accessibility);
            setConility);
          }
        }
      } else {
        c');
      }
    } catch (error) {
      c
      toast({
        title: "เกิดข้อผิดพลาดในการตรวจสอบ",
        descr
        variant: "destructive"
      });
    }
  }, [usess]);

  const loadCourse = useCallba => {
ing(true);
    console.log('CourseLearningPage: Loading cd);
    
    // Add timeout for loading
 {
      console.error('CourseLea
      setLoading(false);
      toast({
        title: "การโหลดใช้เวลานานเกินไป",
        ์เน็ต",
        variant: "destruve"
      });
    }, 10000);
    
    try {
      const { data, error } = a
      cleutId);
      console.
     
      if r) {
        console.error('CourseLearningPage: Course loading er);
        toast({
          title: "ูล",
          description: error.message,
          var"
        });
      } else 
        d');
oast({
          title: "ร์ส",
          description: "คอร์สนี้อาจไม่มีอยู่ในระบบ",
          varia
        });
      } else {
        setCourse(data);
        con);
        
        // Auto-select first content
        if (dat) {
          console.log('CourseLearnin]);
          setSelectedContent(data.content[0]);
        } else {
          cse');
          cons
          console.log('C);
        }

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Cerror);
      toast({
        title: "เกิดข้อผิดพ
        desc
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [cout]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect((> {
    if (urse) {
      console;
      checkEnrollmentAndProgress();
    }
  }, [user, course, checkEnrollgress]);

  const handleC
    // Check if content e
    c;
    if (isContentLocked({
id];
      const lockMesน";
      const block
      

        title: "เนื",
        description: bloc
          ? `กรุณาผ่าน "${blockingContent.title}" ก่อน`
          : lockMessage,
        variant: "destructive
      });
      return;
    }

ontent);
    setShowQuiz(false);
    setActiveQuiz(null);
    setShowAssignment(false);
    setActiveAssignment(null);

    // Mark content as viewed
    try {
      const { error } = await markContentAsViewed(content.id);
      if (error) {
r);
      } else {
        // Update progress in the sidebar
        loadCourseProgress();
      }
    } catch (error) {
      console.error('Error mark
    }

    /
z') {
      const { data: quiz } = awad);
      if (quiz) {
        setActiveQuiz(qu
        setShowQuiz(true);
      }
  }

    // Load assignment if content type is gnment
    if (content.content_type === 'assignment') {
      try {
        const { data: assign
        if (assignment &&  {
       nt);
     t(true);

      } catch (error) {
        console.log(`ไม่พบงานมอบหมายสำหรับเนื้อห}`);
      }
    }
  };

  const handleNextContent = () => {
    if (!selectedContent || !course?.conteeturn;
    
    // Fi
    const currentIndex ;
    if (currentIndex === -1 || currentIndex >= course.content.length -urn;
    
    / content
    
nt);
    
    toast({
      title: "เปลี่ยนไปยังเนื้ถัดไป",
      description: nextContent.title
    });
  };

  const => {
;
    
    // Find current index
    const currentIndex = course.content.fin
    if (curre return;
    
    // Navigate to previous content
    const previousContent 1];
    handleContentSelect(previousContent);
    
    toas({
      title: "เปลี่ยนไปย้า",
     
);
  };

{
    toast({
      title
      description: `คะแนน: ${res`,
      variant: results.is_passed ? "default" : "destruct
    });
    
    // Just refresh progressmpleted
    if (user && course) {
      loadCourseProgress();
    }
    
    setShowQuiz(false);
  };

  const h{
    toast({
      title: "ส่งงานสำเร
     ้ว"
 });
    
    gress

      loadCourseProgress();
    }
    
    setShowAssignment(false);
  };

  const handleConten {
    try {
      // Get the conte
      const content = course?.content?.find(d);
      const typeName = : 
                      content?.content_type === 'tหา' :
                 
                      

      // Show success toast
      toast({
        title: `${typeName}เสร็จสิ้น! 🎉`,
        description: `คุณได้ทำ${typeName}นี้เสร็จเรียบร้อยแล้ว`
      });

      // Mark content as completed using progressService
      if (user && contentId) {
        const { data, error } = await updateContentProgres, {
          completed:ue,
          viewed: true,
          
;
        
        if (error) {
          consolrror);
        } else {
         ;
       
     }

      // Refresh course proy
      if (user && course) {
        loadCouess();
        
        // Also update content accessibility
);
        if (!accessError) {
          setContentAccessibility(accessibility);
        }
      }
      
      // Autolable
      const currentIndex = 
      if (currentIndex !== -1 && currentIndex < course.content. 1) {
        // ntent
        co1];
        toast({
       ",
          descriptionitle,
          action: (
            <
              onClick={() => hant)}
              className="bg-blue-500 hover:bg-blue-60te"
            >
         
     
     )

      }
    } catch (error) {
      console.error('Error in handleContentComr);
t({
        title: "เกิดข้อผิดพลาด",
        description: ",
        variant: "destructive"
     });
  }
  };

  // Keep backward compatibility
  const handleVideo');

  const getContentIcon ==> {
    if (isCompleted) {
      return <CheckCir0" />;
    }
    
    switch (contentType) {
     ideo':
     />;
iz':
        return <Trophy className="w-5 h-5 t>;
      case 'assiment':
        return <FileText className="w-5 h-
      case 'document':
        return <
      
        return <FileText className="w-5 h-5 text-gray-400" />;

  };

  const getContentProgress = (content) => {
    console.log;
    cProgress);
    
    // For all content types, check completion status
    if (!courseProgress?.content_p{
      ');
      return 0;
    }
    
    
;
    console.log('📄 Content progress:', completed);
    return completed;
};

  const getContentCompletionStatusnt) => {
    ifull;
 
    const progress = courseProgress.content_progr
    
    // สำหรับ quiz และ assignment ต้องมี
    if (content.content_type === 'quiz' || ment') {
      i;
      

      if (progress.score !== undefined && progress.ed) {
        return {
          isComp true,
          isPassed: progressassed,
          score: progress.score,
          type: content.content_type
        };
      }
      
ผ่าน
      return {
        isComp
        isPassed: true,
        score: null,
        type: conten
      };
    }
    
ูครบ
    return progress?.is_completed ? {
      isCompleted: true,
      isPtrue,
      score: null,
      type: content.conte
    } : null;
  };

  const isCon
    
 {
      const accessInfo = contentAccessibility[c
      console.log('🔒 Content lock check:', { 
        
        accessInfo, 
        isAccessible: accessInfo?.isAccessible 
      });
      r
    }
    
    // Fallback to old sequent
    if (index === 0;
    const previousContent = course.content[inde;
    constt);
    return previousProgress < 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="animate-v>
    ...</p>

        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div cla-12">
        <div">
      
   p>
alse'}</p>
          <Link >
            n>
          </Link>
        </div>
      </div>
    );
  }

  if (!enrollmentStatus.isEnrolled) {
    return (
      <div cla
        <div className="text-c>
          <h2 className="text-2xl font-bold text-teal-900 mb-2">คุณยั
          <p clas>
          <divb-4">
            title}</p>
      /p>
   s)}</p>
div>
          <Link to={`/courses/${cours>
            >
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradie">
      <Helmet>
        <title>{course.title} - เรียน | Login Learning</title>
      </Helmet>

      {/* Header */}
      <div classNte/10">
        <div c4">
          <d
      -x-4">
   }`}>
00">
          " />
                </Button>
              Link>
              
              <div>
</h1>
                {cou& (
                  <div className="flex items-center space-x-4 text-sm text-te800">
                    <span>ความคืบหน้า: {courseProgres
                    <span>•</span>
                    <span>{courseProgress.completed_itemsn>
                  </div>
                )}
              </div>
            </div>

0">
              <User
              <span>{course.enrollment_count || 0} คน</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="gri">
          {/* Sidebar - Course Con}
          <div className=">
            <div className="bg-white rounded-2xl shadow24">
              <div className="flex items-center mb-6">
                <div classN">
                  <BookO
                </
                <div
                  

                </div>
              </div>
              
              {/* 
              {c
              
            0 mb-3">

                    <span className="text-indigo-60n>
                  </div>
                  <div className="w-full bg-gra
                    <div 
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 roun"
                      style={{ width: `${courseProgres
                    />
                  </div>
                  <div2">
                    <an>
                    <span>เสร็จสิ้น</span>
                  </div>
                </div>
              )}

              {/* Cour
              <div cla">
                {cou? (
 {
                    const progresstent);
                    const locked =ex);
                    const isSelected = selectedContent?.id === content.id;
                    
                    return (
                      <motion.div
                        key={content.id}
                        whi
                        {
                          isSelected 
                        
                            : locked 
                              y-60' 
                              : 'border-gray-200 bg-white hover:border-bd'
                        }
                      }
                      >
                        <div className="relative p-4">
                          <div className=e-x-3">
                            <div className ${
                        cked 
                      00' 
                0 
 
                                  : isSeld
                                    ? 'bg
                                    : 'bg-gradient-to-r from-gray
                            }`}>
                              {locked ? (
                                <Lock className="w-5 h-5 text-white" />
                              ) : progress >= 100 ? (
te" />
                            (
                                <
                              ) : conten (
                                <CheckSquare className="w-5 h-5 text-white" />
                              ) : content.content_type === 'assignment' ? (
                                <Booite" />
                              ) : (
                                <Filhite" />
                              )}
                            </div>
                           
                            <div className="flex-1 min-w-0">
                       {
                                locked ? 'text-gray-50800'
                              }`}>
                                
                              </h4>
                              
                              <div className="fles mb-2">
                                <span className={`$}>
                                  {content.content_type === 'video' ? '📹 วิดีโอ' :
                                   content.con
                                   content.content_type === 'assignment' ? '📋 งาน'}
                                </span>
                                {s && (
                             >
                                    <Cloc
                                    <span>{content.duration_minutes} นา
                                  </div>
                                )}
                              </div>
                              
                              {/* Progress bar for individual content
                              {locked ? (
                                <div className="text-xs text-red-600 bg-red
                                  <div className="flex items-center space-x>
                                   
                                    <span className="font-medium">เนื้อหาถู
                                
                                  0">
าก่อน'}
                                  </div>
                                  && (
                                    <div className="mt-1 text-blue-600">
                                      ต้.title}"
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <di">
                                
                                    className={
                                   
0' 
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                    }`}
                                    style={{ wid}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-">
                    <FileText className="w-12 h-12 mx-auto mb->
                    <p>ยังไม่มีเนื้อหาในคอร์สนี้</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Learning Content */}
          <div className="lg:col-span-3">
            {/* Show Content Player when content is selected */}
            {selectedContent ? (
              <div className="bg-white rounded-2xl shadow-xl born">
                {/* Content Header */}
                <div className="bg-gradient-to-r froe">
                  <div className="flex itemen">
                    <div className="flex">
                      <div className="bg-white/20 p-3 rounded-xl backdsm">
                        {selectedContent.content_type === 'vi/>}
                        {selectedContent.content_type === 'text' && <F" />}
                        {selectedContent.content_typite" />}
                        {selectedContent.content_type === 'assignment
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedh2>
                        <div className="flex items-center te>
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{selectedContent.dun>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6">
                  {/* Video Player */}
                  {selectedContent.content_type === 'video' && (selectedContent.conteurl) && (
                    <div>
                      <VideoPlayer
                        src={selectedContent.content__url}
                        contentId={selectedContent.id}
                        title={selectedContent.title}
                        autoPlay={false
                        onComplete={handleVi
                      />
                      
                      {/* Video Comp
                      <div className="">
                        {getCont0 ? (
                          <div cla>
                            <div-lg">
                              
                              วิดีโ้ว
                      
                      </div>
                     : (
                          <div className="text-center">
                            <Button 
                              onClick={() => handleCeo')}
                        -600"
                  
                    />
                  
                

                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  {selectedContent.content_type === 'text' && (
                    <div>
                      <div className="prose max-w-none" dangerous
                      
                      {/* Text Completion Controls */}
                      <div className="mt-6 border-t pt-6">
                        {g
                          <div className="text-center">
                            <div className="inline-flex items-center lg">
                          " />
                              เนื้อหานี้อ่านเสร็จสิ้นแล้ว
                            </div>
                          v>
                        ) : (
                          <div className="text-center">
                          
                            text')}
                           "
                            >
                              <CheckCircle classN
                             จแล้ว
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quiz */}
                  {seleciz && (
                    <QzPlayer
Quiz}
                      onComplete={hamplete}
                      onClose={() => iz(false)}
                    />
                  )}

                  {/* Assignment Player */}
                  {selected
                    <AssignmentPlayer
                      contentId
                      assignment={activeAssignment}
                      onComplete={handleAssignmentCom}
                    />
                  )}

                  {/* Quiz Setup for Admin */}
                  {isAdmin && selectedContent.content_type
                    <div c
4">
                        <Trophy className="w-8 h-8 text-y>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 
                      <p className="text-gray-700 mb-6">ค/p>
                      <Button onClick={() => setShowQuizSetup(true)}>สร้างแบบทดสอบ</Button>
                    </div>
                  )}

                  {/* Assignment S*/}
                  {isAdmin && s(
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-10>
                        <FileText className="w-8 h-8 text-purple-500" />
                      </div>
                      <h3 className="text-xl font->
                      <p className="tี้ได้</p>
                      <Button onClick={() => setShowAssignmentSetup(tru
                    </div>
                  )}

                  {/* Content Atta */}
                  <div class-8">
>
                  </div>

                  {/* Navigation Controls */}
                  <div className="mt-8 flex items-center justify-between border-t pt-6">
                    <Button
                      variant="outline"
                      onClick={handlePreviousContent}
                      disabled={!course0}
                    >
                      <ArrowLeft className=>
                      เนื้อหาก่อนหน้า
                    </Button>
                    
                    <Button
                      onClick={handleN
                      disabled={!course?.co 1}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      เนื้อหาถัดไป
                      <ArrowRight class" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white er">
                <div className="w-20 h-20 bg-blue-1">
                  <FileText className="w-10>
                </div>
                <h3 className="text-2xl font-bold 
                <p className="text-gray-700 mb-6">กรุณาเลือกเนื้อห
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Quiz Setup Modal */}
      {showQuizSetup && selectedCont& (
        <QuickQuizSetup
          contentId={selectedContent.id}
          courseId={courseId}
          onClose={() => setShowQuizSetup)}
          onSuccess={(quiz) => {
            setActiveQuiz(quiz);
            setShowQuiz(true);
            setShowQuizSetup(fse);
            toast({
              title: "
"
            });
          }}
        />
      )}

      {/* Admin Assignment Setup Modal */}
      {showAssignmentSetup && selectedContent && (
        <QuickAssignmentSetup
          contentId={selec.id}
          courseId={courseId}

          onSuccess={(assignment) => {
            setActiveAssignment(assignmen
            setShowAssignment(true);
            setShowAssignmentSetup(false);
            toast({

              description: "งานมอบหมายถูกสร้างและเปิดใช้งานแล้ว"
            });
          }}
        />
      )}
    </div>
  );
};

export default CourseLearningage;P