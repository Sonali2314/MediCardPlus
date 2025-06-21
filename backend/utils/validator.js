/**
 * Validate email
 * @param {String} email - Email to validate
 * @returns {Boolean} - Whether email is valid
 */
exports.isValidEmail = (email) => {
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(email);
  };
  
  /**
   * Validate password strength
   * @param {String} password - Password to validate
   * @returns {Object} - Validation result
   */
  exports.validatePassword = (password) => {
    // Password should be at least 6 characters
    if (password.length < 6) {
      return {
        isValid: false,
        message: 'Password must be at least 6 characters long'
      };
    }
  
    // Password should contain at least one number
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number'
      };
    }
  
    return {
      isValid: true,
      message: 'Password is valid'
    };
  };
  
  /**
   * Validate phone number
   * @param {String} phone - Phone number to validate
   * @returns {Boolean} - Whether phone number is valid
   */
  exports.isValidPhone = (phone) => {
    // Basic phone validation (allow different formats)
    const regex = /^\+?[0-9\s\-\(\)]{8,20}$/;
    return regex.test(phone);
  };
  
  /**
   * Sanitize input for security
   * @param {String} input - Input to sanitize
   * @returns {String} - Sanitized input
   */
  exports.sanitizeInput = (input) => {
    if (!input) return '';
    
    // Convert to string if not already
    const str = String(input);
    
    // Replace potentially dangerous characters
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };