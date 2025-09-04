import { format, parseISO, isValid } from 'date-fns'


// Helper function to safely format dates using date-fns
export const formatDate = (dateString: string): string => {
    console.log('formatDate: Input date string:', dateString, 'Type:', typeof dateString)
    if (!dateString) {
      console.log('formatDate: No date string provided')
      return 'Unknown'
    }
    
    console.log('formatDate: Input date string:', dateString, 'Type:', typeof dateString)
    
    try {
      // First try to parse as ISO string (PostgreSQL format)
      let date = parseISO(dateString)
      console.log('formatDate: parseISO result:', date, 'isValid:', isValid(date))
      
      // If that fails, try regular Date constructor
      if (!isValid(date)) {
        date = new Date(dateString)
        console.log('formatDate: new Date result:', date, 'isValid:', isValid(date))
      }
      
      // Check if date is valid
      if (!isValid(date)) {
        console.error('formatDate: Invalid date string:', dateString)
        return 'Invalid Date'
      }
      
      const formatted = format(date, 'MMM dd, yyyy')
      console.log('formatDate: Formatted result:', formatted)
      return formatted
    } catch (error) {
      console.error('formatDate: Error formatting date:', error, 'Date string:', dateString)
      return 'Invalid Date'
    }
  }