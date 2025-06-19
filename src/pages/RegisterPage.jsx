import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { register } from '../services/authService'; // Adjust the import based on your file structure

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    emailid: '',
    password: '',
    confirm_password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate full name
    if (!formData.full_name.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    // Validate email
    if (!formData.emailid.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailid)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirm_password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setError('');
      try {
        await register(formData);
        // Redirect to dashboard or login page after successful registration
        navigate('/login');
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({ submit: 'Registration failed. Please try again.' });
        setError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#f8fcfa] overflow-x-hidden">
      <div className="flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e6f4ef] px-10 py-3">
          <div className="flex items-center gap-4 text-[#0c1c17]">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_319)">
                  <path
                    d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"
                    fill="currentColor"
                  ></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_319"><rect width="48" height="48" fill="white"></rect></clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-[#0c1c17] text-lg font-bold leading-tight tracking-[-0.015em]">Interview AI</h2>
          </div>
        </header>
        
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="flex flex-col w-[512px] max-w-[512px] py-5 flex-1">
            <h2 className="text-[#0c1c17] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">Create Your Account</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0c1c17] text-base font-medium leading-normal pb-2">Full Name</p>
                  <input
                    name="full_name"
                    placeholder="Enter your full name"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0c1c17] focus:outline-0 focus:ring-0 border ${errors.fullName ? 'border-red-500' : 'border-[#cde9df]'} bg-[#f8fcfa] focus:border-[#cde9df] h-14 placeholder:text-[#46a080] p-[15px] text-base font-normal leading-normal`}
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0c1c17] text-base font-medium leading-normal pb-2">Email Address</p>
                  <input
                    name="emailid"
                    type="email"
                    placeholder="Enter your email address"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0c1c17] focus:outline-0 focus:ring-0 border ${errors.email ? 'border-red-500' : 'border-[#cde9df]'} bg-[#f8fcfa] focus:border-[#cde9df] h-14 placeholder:text-[#46a080] p-[15px] text-base font-normal leading-normal`}
                    value={formData.emailid}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0c1c17] text-base font-medium leading-normal pb-2">Password</p>
                  <input
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0c1c17] focus:outline-0 focus:ring-0 border ${errors.password ? 'border-red-500' : 'border-[#cde9df]'} bg-[#f8fcfa] focus:border-[#cde9df] h-14 placeholder:text-[#46a080] p-[15px] text-base font-normal leading-normal`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </label>
              </div>
              
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                <label className="flex flex-col min-w-40 flex-1">
                  <p className="text-[#0c1c17] text-base font-medium leading-normal pb-2">Confirm Password</p>
                  <input
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm your password"
                    className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0c1c17] focus:outline-0 focus:ring-0 border ${errors.confirmPassword ? 'border-red-500' : 'border-[#cde9df]'} bg-[#f8fcfa] focus:border-[#cde9df] h-14 placeholder:text-[#46a080] p-[15px] text-base font-normal leading-normal`}
                    value={formData.confirm_password}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </label>
              </div>
              
              {errors.submit && <p className="text-red-500 text-sm px-4">{errors.submit}</p>}
              
              <div className="flex px-4 py-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 bg-[#019863] text-[#f8fcfa] text-sm font-bold leading-normal tracking-[0.015em]"
                >
                  <span className="truncate">{isSubmitting ? 'Registering...' : 'Register'}</span>
                </button>
              </div>
            </form>
            
            {error && <div style={{ color: 'red' }}>{error}</div>}
            
            <p className="text-[#46a080] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
              Already have an account? <Link to="/login" className="underline">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;