import { createContext, useContext, useEffect, useState } from 'react'
import { onTeacherAuthChange } from '../firebase/authService'

/**
 * Provides the signed-in teacher (real auth) to host pages.
 *
 * teacher:
 *   undefined  → still loading (Firebase restoring session from IndexedDB)
 *   null       → not signed in, or signed in anonymously (student)
 *   User       → signed-in teacher (Google or email/password)
 *
 * Students always use anonymous auth and are intentionally excluded here.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(undefined) // undefined = loading

  useEffect(() => {
    const unsub = onTeacherAuthChange(user => {
      if (user && !user.isAnonymous) {
        setTeacher(user)
      } else {
        setTeacher(null)
      }
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{
      teacher,
      teacherLoading: teacher === undefined,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Use inside any component that needs to know who the teacher is. */
export function useAuth() {
  return useContext(AuthContext)
}
