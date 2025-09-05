import { format, parseISO, isValid } from 'date-fns'


// Helper function to safely format dates using date-fns
export const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) {
      return 'Unknown'
    }
    
    try {
      let date: Date
      
      // Handle different input types
      if (dateInput instanceof Date) {
        // Already a Date object
        date = dateInput
      } else if (typeof dateInput === 'string') {
        // Handle string inputs
        if (dateInput.includes('T') || dateInput.includes('Z')) {
          // ISO format string
          date = parseISO(dateInput)
        } else {
          // Try regular Date constructor for other formats
          date = new Date(dateInput)
        }
      } else {
        // Try to convert to Date
        date = new Date(dateInput as any)
      }
      
      // Validate the date
      if (!isValid(date)) {
        console.warn('formatDate: Invalid date:', dateInput)
        return 'Invalid Date'
      }
      
      // Format the date
      return format(date, 'MMM dd, yyyy')
    } catch (error) {
      console.error('formatDate: Error formatting date:', error, 'Input:', dateInput)
      return 'Invalid Date'
    }
  }