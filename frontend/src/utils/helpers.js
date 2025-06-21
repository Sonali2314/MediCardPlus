/**
 * Collection of helper functions for the Healthcare Platform
 */

/**
 * Format date to localized string
 * @param {Date|string} date - Date object or date string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return new Date(date).toLocaleDateString(undefined, defaultOptions);
  };
  
  /**
   * Format time to localized string
   * @param {Date|string} date - Date object or date string
   * @returns {string} Formatted time string
   */
  export const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Calculate age from birth date
   * @param {Date|string} birthDate - Birth date
   * @returns {number} Age in years
   */
  export const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  /**
   * Truncate text to specified length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated text
   */
  export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };
  
  /**
   * Generate initials from name
   * @param {string} name - Full name
   * @returns {string} Initials (max 2 characters)
   */
  export const getInitials = (name) => {
    if (!name) return '';
    
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  /**
   * Format phone number to (XXX) XXX-XXXX format
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} Formatted phone number
   */
  export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if the input is of correct length
    if (cleaned.length !== 10) return phoneNumber;
    
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  };
  
  /**
   * Check if object is empty
   * @param {Object} obj - Object to check
   * @returns {boolean} True if empty
   */
  export const isEmptyObject = (obj) => {
    return obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype;
  };
  
  /**
   * Filter medical records by search query
   * @param {Array} records - Medical records array
   * @param {string} query - Search query
   * @returns {Array} Filtered records
   */
  export const filterMedicalRecords = (records, query) => {
    if (!query || !records?.length) return records;
    
    const searchTerm = query.toLowerCase();
    
    return records.filter(record => {
      // Search by disease name
      if (record.diseaseName.toLowerCase().includes(searchTerm)) return true;
      
      // Search in visits
      if (record.visits?.some(visit => {
        // Search in doctor name
        if (visit.doctor?.name.toLowerCase().includes(searchTerm)) return true;
        
        // Search in diagnosis
        if (visit.diagnosis?.toLowerCase().includes(searchTerm)) return true;
        
        // Search in prescription
        if (visit.prescription?.medications?.some(med => 
          med.name.toLowerCase().includes(searchTerm)
        )) return true;
        
        return false;
      })) return true;
      
      return false;
    });
  };
  
  /**
   * Group visits by date (for timeline view)
   * @param {Array} visits - Array of visit objects
   * @returns {Object} Grouped visits by date
   */
  export const groupVisitsByDate = (visits) => {
    if (!visits?.length) return {};
    
    return visits.reduce((acc, visit) => {
      const dateKey = new Date(visit.visitDate).toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(visit);
      return acc;
    }, {});
  };
  
  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  /**
   * Check if a file type is allowed
   * @param {string} fileType - MIME type of the file
   * @param {Array} allowedTypes - Array of allowed MIME types
   * @returns {boolean} Whether the file type is allowed
   */
  export const isAllowedFileType = (fileType, allowedTypes = []) => {
    return allowedTypes.includes(fileType);
  };
  
  /**
   * Convert array of objects to CSV string
   * @param {Array} array - Array of objects
   * @returns {string} CSV string
   */
  export const arrayToCSV = (array) => {
    if (!array?.length) return '';
    
    const header = Object.keys(array[0]).join(',');
    const rows = array.map(obj => 
      Object.values(obj).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    
    return [header, ...rows].join('\n');
  };
  
  /**
   * Download data as a file
   * @param {string} content - File content
   * @param {string} fileName - File name
   * @param {string} contentType - Content type
   */
  export const downloadFile = (content, fileName, contentType) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };