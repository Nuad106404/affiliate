import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, User, Phone, MapPin, ShoppingBag, Sparkles, ArrowRight, ArrowLeft, CreditCard, Building } from 'lucide-react';
import LoadingSpinner from './common/LoadingSpinner';

interface PersonalInfoForm {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  refCode: string;
}

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface BankInfoForm {
  bankName: string;
  accountNumber: string;
  accountOwnerName: string;
}

type RegisterForm = PersonalInfoForm & AddressForm & BankInfoForm & {
  agreeToTerms: boolean;
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingRefCode, setValidatingRefCode] = useState(false);
  const [refCodeError, setRefCodeError] = useState('');
  const [bonusCredits, setBonusCredits] = useState<number | null>(null);
  
  // Form data storage
  const [formData, setFormData] = useState<Partial<RegisterForm>>({});
  
  // Step 1: Personal Information
  const { register: registerStep1, handleSubmit: handleSubmitStep1, watch, formState: { errors: errorsStep1 } } = useForm<PersonalInfoForm>();
  
  // Step 2: Address Information
  const { register: registerStep2, handleSubmit: handleSubmitStep2, formState: { errors: errorsStep2 } } = useForm<AddressForm>();
  
  // Step 3: Bank Information
  const { register: registerStep3, handleSubmit: handleSubmitStep3, formState: { errors: errorsStep3 } } = useForm<BankInfoForm & { agreeToTerms: boolean }>();

  const password = watch('password');

  const onSubmitStep1 = async (data: PersonalInfoForm) => {
    try {
      setValidatingRefCode(true);
      setRefCodeError('');
      setBonusCredits(null);
      
      // Validate referral code before proceeding
      const response = await authAPI.validateReferralCode(data.refCode);
      
      if (response.data.success) {
        // Store bonus credits if provided in the response
        if (response.data.bonusCredits) {
          setBonusCredits(response.data.bonusCredits);
        }
        
        // Proceed to next step if validation is successful
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(2);
      } else {
        // If server returns success: false but no error message
        setRefCodeError('รหัสแนะนำไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      // Handle API errors
      setRefCodeError(err.response?.data?.message || 'รหัสแนะนำไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
    } finally {
      setValidatingRefCode(false);
    }
  };

  const onSubmitStep2 = (data: AddressForm) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const onSubmitStep3 = async (data: BankInfoForm & { agreeToTerms: boolean }) => {
    try {
      setError('');
      setLoading(true);
      
      const finalData = { ...formData, ...data };
      
      // Transform data to match backend schema
      const registrationData = {
        name: finalData.name,
        phone: finalData.phone,
        password: finalData.password,
        address: {
          street: finalData.street,
          city: finalData.city,
          state: finalData.state,
          zipCode: finalData.zipCode,
          country: finalData.country
        },
        bankDetails: {
          bankName: finalData.bankName,
          accountNumber: finalData.accountNumber,
          accountOwnerName: finalData.accountOwnerName
        },
        referralCode: finalData.refCode
      };
      
      await registerUser(registrationData);
      
      // Redirect to home page after successful registration
      navigate('/', { 
        state: { message: 'ลงทะเบียนสำเร็จ! ยินดีต้อนรับสู่แพลตฟอร์ม' }
      });
    } catch (err: any) {
      setError(err.message || 'การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'สมัครสมาชิก';
      case 2: return 'ข้อมูลที่อยู่';
      case 3: return 'ข้อมูลธนาคาร';
      default: return 'ลงทะเบียน';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'กรอกข้อมูลพื้นฐานของคุณ';
      case 2: return 'ระบุรายละเอียดที่อยู่ของคุณ';
      case 3: return 'เพิ่มข้อมูลธนาคารของคุณ';
      default: return 'ดำเนินการลงทะเบียนให้เสร็จสิ้น';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {getStepTitle()}
            </h2>
            <p className="text-gray-600 mb-6">
              {getStepDescription()}
            </p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex space-x-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-3 text-sm text-gray-600">
                ขั้นตอนที่ {currentStep} จาก 3
              </span>
            </div>
            

          </div>

          {/* Registration Form */}
          <div className="card shadow-xl">
            <div className="p-8">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <form className="space-y-6" onSubmit={handleSubmitStep1(onSubmitStep1)}>
                  {/* Full Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                      ชื่อเต็ม
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep1('name', { 
                          required: 'กรุณากรอกชื่อเต็ม',
                          minLength: {
                            value: 2,
                            message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
                          }
                        })}
                        type="text"
                        autoComplete="name"
                        className={`input pl-10 ${errorsStep1.name ? 'input-error' : ''}`}
                        placeholder="กรอกชื่อเต็มของคุณ"
                      />
                    </div>
                    {errorsStep1.name && <p className="mt-2 text-sm text-red-600">{errorsStep1.name.message}</p>}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2">
                      หมายเลขโทรศัพท์
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep1('phone', { 
                          required: 'กรุณากรอกหมายเลขโทรศัพท์',
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Phone number must be exactly 10 digits'
                          },
                          minLength: {
                            value: 10,
                            message: 'Phone number must be exactly 10 digits'
                          },
                          maxLength: {
                            value: 10,
                            message: 'Phone number must be exactly 10 digits'
                          }
                        })}
                        type="tel"
                        className={`input pl-10 ${errorsStep1.phone ? 'input-error' : ''}`}
                        placeholder="กรอกหมายเลขโทรศัพท์ 10 หลัก"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          e.target.value = value;
                          if (value.length === 10) {
                            const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement;
                            if (passwordField) {
                              passwordField.focus();
                            }
                          }
                        }}
                      />
                    </div>
                    {errorsStep1.phone && <p className="mt-2 text-sm text-red-600">{errorsStep1.phone.message}</p>}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                      รหัสผ่าน
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep1('password', { 
                          required: 'กรุณากรอกรหัสผ่าน',
                          minLength: {
                            value: 6,
                            message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                          }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`input pl-10 pr-10 ${errorsStep1.password ? 'input-error' : ''}`}
                        placeholder="สร้างรหัสผ่าน"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errorsStep1.password && <p className="mt-2 text-sm text-red-600">{errorsStep1.password.message}</p>}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-2">
                      ยืนยันรหัสผ่าน
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep1('confirmPassword', { 
                          required: 'กรุณายืนยันรหัสผ่าน',
                          validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`input pl-10 pr-10 ${errorsStep1.confirmPassword ? 'input-error' : ''}`}
                        placeholder="ยืนยันรหัสผ่านของคุณ"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errorsStep1.confirmPassword && <p className="mt-2 text-sm text-red-600">{errorsStep1.confirmPassword.message}</p>}
                  </div>



                  {/* Referral Code Field */}
                  <div>
                    <label htmlFor="refCode" className="block text-sm font-semibold text-gray-800 mb-2">
                      รหัสแนะนำ
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep1('refCode', { 
                          required: 'กรุณากรอกรหัสแนะนำ',
                          pattern: {
                            value: /^[0-9]{6}$/,
                            message: 'รหัสแนะนำต้องเป็นตัวเลข 6 หลัก'
                          }
                        })}
                        type="text"
                        className={`input pl-10 ${(errorsStep1.refCode || refCodeError) ? 'input-error' : bonusCredits ? 'border-green-500' : ''}`}
                        placeholder="กรอกรหัสแนะนำ 6 หลัก"
                      />
                    </div>
                    {errorsStep1.refCode && <p className="mt-2 text-sm text-red-600">{errorsStep1.refCode.message}</p>}
                    {refCodeError && !errorsStep1.refCode && <p className="mt-2 text-sm text-red-600">{refCodeError}</p>}
                    {bonusCredits && !refCodeError && <p className="mt-2 text-sm text-green-600">รหัสถูกต้อง! คุณจะได้รับเครดิตโบนัส {bonusCredits} เมื่อลงทะเบียนเสร็จสิ้น</p>}
                  </div>

                  {/* Next Button */}
                  <button
                    type="submit"
                    disabled={validatingRefCode}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {validatingRefCode ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">กำลังตรวจสอบรหัส...</span>
                      </div>
                    ) : (
                      <>
                        <span>ขั้นตอนถัดไป</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Address Information */}
              {currentStep === 2 && (
                <form className="space-y-6" onSubmit={handleSubmitStep2(onSubmitStep2)}>
                  {/* Address Field */}
                  <div>
                    <label htmlFor="street" className="block text-sm font-semibold text-gray-800 mb-2">
                      Street Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep2('street', { 
                          required: 'Address is required'
                        })}
                        type="text"
                        className={`input pl-10 ${errorsStep2.street ? 'input-error' : ''}`}
                        placeholder="Enter your street address"
                      />
                    </div>
                    {errorsStep2.street && <p className="mt-2 text-sm text-red-600">{errorsStep2.street.message}</p>}
                  </div>

                  {/* City and Province */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        {...registerStep2('city', { 
                          required: 'City is required'
                        })}
                        type="text"
                        className={`input ${errorsStep2.city ? 'input-error' : ''}`}
                        placeholder="Your city"
                      />
                      {errorsStep2.city && <p className="mt-1 text-sm text-red-600">{errorsStep2.city.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province
                      </label>
                      <input
                        {...registerStep2('state', { 
                          required: 'State/Province is required'
                        })}
                        type="text"
                        className={`input ${errorsStep2.state ? 'input-error' : ''}`}
                        placeholder="Your state/province"
                      />
                      {errorsStep2.state && <p className="mt-1 text-sm text-red-600">{errorsStep2.state.message}</p>}
                    </div>
                  </div>

                  {/* Postal Code and Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP/Postal Code
                      </label>
                      <input
                        {...registerStep2('zipCode', { 
                          required: 'ZIP/Postal code is required'
                        })}
                        type="text"
                        className={`input ${errorsStep2.zipCode ? 'input-error' : ''}`}
                        placeholder="ZIP/Postal code"
                      />
                      {errorsStep2.zipCode && <p className="mt-1 text-sm text-red-600">{errorsStep2.zipCode.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <select
                        {...registerStep2('country', { 
                          required: 'Country is required'
                        })}
                        className={`input ${errorsStep2.country ? 'input-error' : ''}`}
                      >
                        <option value="">Select country</option>
                        <option value="TH">Thailand</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                      </select>
                      {errorsStep2.country && <p className="mt-1 text-sm text-red-600">{errorsStep2.country.message}</p>}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={goBack}
                      className="btn btn-secondary btn-lg flex-1"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg flex-1"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Bank Information */}
              {currentStep === 3 && (
                <form className="space-y-6" onSubmit={handleSubmitStep3(onSubmitStep3)}>
                  {/* Bank Name Field */}
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-semibold text-gray-800 mb-2">
                      ชื่อธนาคาร
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        {...registerStep3('bankName', { 
                          required: 'กรุณาเลือกชื่อธนาคาร'
                        })}
                        className={`input pl-10 ${errorsStep3.bankName ? 'input-error' : ''}`}
                      >
                        <option value="">เลือกชื่อธนาคาร</option>
                        <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                        <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                        <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                        <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                        <option value="ธนาคารซีไอเอ็มบีไทย">ธนาคารซีไอเอ็มบีไทย</option>
                        <option value="ธนาคารทิเอ็มบีธนชาต">ธนาคารทิเอ็มบีธนชาต</option>
                        <option value="ธนาคารออมสิน">ธนาคารออมสิน</option>
                        <option value="ธนาคารอิสลามแห่งประเทศไทย">ธนาคารอิสลามแห่งประเทศไทย</option>
                        <option value="ธนาคารเกียรตินาคินภัทร">ธนาคารเกียรตินาคินภัทร</option>
                        <option value="ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย">ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย</option>
                        <option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร">ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร</option>
                        <option value="ธนาคารเมกะ สากลพาณิชย์">ธนาคารเมกะ สากลพาณิชย์</option>
                        <option value="ธนาคารแลนด์ แอนด์ เฮ้าส์">ธนาคารแลนด์ แอนด์ เฮ้าส์</option>
                        <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                        <option value="ธนาคารไทยเครดิต เพื่อรายย่อย">ธนาคารไทยเครดิต เพื่อรายย่อย</option>
                      </select>
                    </div>
                    {errorsStep3.bankName && <p className="mt-2 text-sm text-red-600">{errorsStep3.bankName.message}</p>}
                  </div>

                  {/* Bank Account Number Field */}
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-800 mb-2">
                      หมายเลขบัญชีธนาคาร
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep3('accountNumber', { 
                          required: 'กรุณากรอกหมายเลขบัญชีธนาคาร',
                          pattern: {
                            value: /^[0-9-]+$/,
                            message: 'กรุณากรอกหมายเลขบัญชีที่ถูกต้อง'
                          }
                        })}
                        type="text"
                        className={`input pl-10 ${errorsStep3.accountNumber ? 'input-error' : ''}`}
                        placeholder="กรอกหมายเลขบัญชี"
                      />
                    </div>
                    {errorsStep3.accountNumber && <p className="mt-2 text-sm text-red-600">{errorsStep3.accountNumber.message}</p>}
                  </div>

                  {/* Account Owner Name Field */}
                  <div>
                    <label htmlFor="accountOwnerName" className="block text-sm font-semibold text-gray-800 mb-2">
                      ชื่อเจ้าของบัญชี
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerStep3('accountOwnerName', { 
                          required: 'กรุณากรอกชื่อเจ้าของบัญชี',
                          minLength: {
                            value: 2,
                            message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
                          }
                        })}
                        type="text"
                        className={`input pl-10 ${errorsStep3.accountOwnerName ? 'input-error' : ''}`}
                        placeholder="กรอกชื่อเต็มของเจ้าของบัญชี"
                      />
                    </div>
                    {errorsStep3.accountOwnerName && <p className="mt-2 text-sm text-red-600">{errorsStep3.accountOwnerName.message}</p>}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        {...registerStep3('agreeToTerms', { 
                          required: 'คุณต้องยอมรับข้อกำหนดและเงื่อนไข' 
                        })}
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="agreeToTerms" className="text-gray-700">
                        ฉันยอมรับ{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                          ข้อกำหนดการใช้บริการ
                        </a>{' '}
                        และ{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                          นโยบายความเป็นส่วนตัว
                        </a>
                      </label>
                      {errorsStep3.agreeToTerms && <p className="mt-1 text-red-600">{errorsStep3.agreeToTerms.message}</p>}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="text-sm text-red-800">{error}</div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={goBack}
                      className="btn btn-secondary btn-lg flex-1"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-lg flex-1"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">กำลังสร้าง...</span>
                        </div>
                      ) : (
                        'สร้างบัญชี'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Footer - Only show on first step */}
              {currentStep === 1 && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    มีบัญชีอยู่แล้ว?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      เข้าสู่ระบบ
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;