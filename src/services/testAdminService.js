import { supabase } from '../lib/supabase'

/**
 * Fetch all mock tests with question counts and attempt counts
 */
export async function fetchAdminTests() {
  const { data: tests, error } = await supabase
    .from('mock_tests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin tests:', error)
    throw error
  }

  // Fetch question counts per test
  const { data: questions } = await supabase
    .from('test_questions')
    .select('id, test_id')

  // Fetch attempt counts per test
  const { data: attempts } = await supabase
    .from('test_attempts')
    .select('id, test_id, score')

  const qCountMap = {}
  if (questions) {
    questions.forEach((q) => {
      qCountMap[q.test_id] = (qCountMap[q.test_id] || 0) + 1
    })
  }

  const attCountMap = {}
  const topScoreMap = {}
  if (attempts) {
    attempts.forEach((a) => {
      attCountMap[a.test_id] = (attCountMap[a.test_id] || 0) + 1
      if (topScoreMap[a.test_id] === undefined || a.score > topScoreMap[a.test_id]) {
        topScoreMap[a.test_id] = a.score
      }
    })
  }

  return (tests || []).map((t) => ({
    ...t,
    questions_count: qCountMap[t.id] || 0,
    attempts_count: attCountMap[t.id] || 0,
    top_score: topScoreMap[t.id] !== undefined ? topScoreMap[t.id] : null,
  }))
}

/**
 * Fetch a single test with all its questions
 */
export async function fetchTestWithQuestions(testId) {
  const { data: test, error: testErr } = await supabase
    .from('mock_tests')
    .select('*')
    .eq('id', testId)
    .single()

  if (testErr) throw testErr

  const { data: questions, error: qErr } = await supabase
    .from('test_questions')
    .select('*')
    .eq('test_id', testId)
    .order('order_index', { ascending: true })

  if (qErr) throw qErr

  return {
    ...test,
    questions: questions || [],
  }
}

/**
 * Create a new mock test
 */
export async function createTest(testData) {
  const { data, error } = await supabase
    .from('mock_tests')
    .insert([
      {
        title: testData.title,
        description: testData.description || null,
        category: testData.category || 'General',
        duration_minutes: Number(testData.duration_minutes) || 60,
        total_marks: Number(testData.total_marks) || 100,
        positive_marks: Number(testData.positive_marks) || 1,
        negative_marks: Number(testData.negative_marks) || 0.25,
        is_free: Boolean(testData.is_free),
        price: Number(testData.price) || 0,
        is_published: Boolean(testData.is_published),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating test:', error)
    throw error
  }
  return data
}

/**
 * Update test details
 */
export async function updateTest(testId, testData) {
  const { data, error } = await supabase
    .from('mock_tests')
    .update({
      title: testData.title,
      description: testData.description || null,
      category: testData.category || 'General',
      duration_minutes: Number(testData.duration_minutes) || 60,
      total_marks: Number(testData.total_marks) || 100,
      positive_marks: Number(testData.positive_marks) || 1,
      negative_marks: Number(testData.negative_marks) || 0.25,
      is_free: Boolean(testData.is_free),
      price: Number(testData.price) || 0,
      is_published: Boolean(testData.is_published),
      updated_at: new Date().toISOString(),
    })
    .eq('id', testId)
    .select()
    .single()

  if (error) {
    console.error('Error updating test:', error)
    throw error
  }
  return data
}

/**
 * Delete a mock test (cascades to questions & attempts)
 */
export async function deleteTest(testId) {
  const { error } = await supabase.from('mock_tests').delete().eq('id', testId)
  if (error) {
    console.error('Error deleting test:', error)
    throw error
  }
  return true
}

/**
 * Toggle test publish state
 */
export async function toggleTestPublish(testId, isPublished) {
  const { data, error } = await supabase
    .from('mock_tests')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', testId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling publish status:', error)
    throw error
  }
  return data
}

/**
 * Save questions for a test (upsert / delete batch)
 */
export async function saveTestQuestions(testId, questionsList) {
  // 1. Fetch existing question IDs
  const { data: existing, error: fetchErr } = await supabase
    .from('test_questions')
    .select('id')
    .eq('test_id', testId)

  if (fetchErr) throw fetchErr

  const existingIds = (existing || []).map((q) => q.id)
  const currentIds = questionsList.map((q) => q.id).filter((id) => id && !String(id).startsWith('new_'))

  // IDs to delete
  const idsToDelete = existingIds.filter((id) => !currentIds.includes(id))

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('test_questions')
      .delete()
      .in('id', idsToDelete)
    if (delErr) throw delErr
  }

  // Upsert current questions
  if (questionsList.length > 0) {
    const records = questionsList.map((q, idx) => {
      const isNew = !q.id || String(q.id).startsWith('new_')
      const item = {
        test_id: testId,
        section_name: q.section_name || 'General',
        question_text: q.question_text || '',
        question_image_url: q.question_image_url || null,
        options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
        correct_option_index: Number(q.correct_option_index) || 0,
        explanation: q.explanation || null,
        order_index: idx + 1,
        positive_marks: q.positive_marks !== null && q.positive_marks !== undefined && q.positive_marks !== '' ? Number(q.positive_marks) : null,
        negative_marks: q.negative_marks !== null && q.negative_marks !== undefined && q.negative_marks !== '' ? Number(q.negative_marks) : null,
      }
      if (!isNew) {
        item.id = q.id
      }
      return item
    })

    const { error: upsertErr } = await supabase
      .from('test_questions')
      .upsert(records)

    if (upsertErr) throw upsertErr
  }

  return true
}

/**
 * Fetch all student attempts for a test
 */
export async function fetchTestAttempts(testId) {
  const { data: attempts, error } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', testId)
    .order('score', { ascending: false })
    .order('time_taken_seconds', { ascending: true })

  if (error) throw error

  const userIds = Array.from(new Set((attempts || []).map((a) => a.user_id).filter(Boolean)))
  let userMap = {}

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, photo_url')
      .in('id', userIds)

    if (users) {
      users.forEach((u) => {
        userMap[u.id] = u
      })
    }
  }

  return (attempts || []).map((a, idx) => ({
    ...a,
    rank: idx + 1,
    student_name: userMap[a.user_id]?.name || 'Student #' + (a.user_id ? a.user_id.slice(0, 5) : idx + 1),
    student_email: userMap[a.user_id]?.email || 'N/A',
    student_photo: userMap[a.user_id]?.photo_url || null,
  }))
}


/**
 * Fetch overview statistics and recent submissions for the admin dashboard
 */
export async function fetchTestDashboardStats() {
  const [testsCount, publishedTestsCount, attemptsCount, questionsCount] = await Promise.all([
    supabase.from('mock_tests').select('*', { count: 'exact', head: true }),
    supabase.from('mock_tests').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('test_attempts').select('*', { count: 'exact', head: true }),
    supabase.from('test_questions').select('*', { count: 'exact', head: true }),
  ])

  // Fetch 5 most recent test attempts
  const { data: recentAttempts } = await supabase
    .from('test_attempts')
    .select('id, user_id, test_id, score, total_marks, accuracy_percentage, submitted_at, mock_tests(title)')
    .order('submitted_at', { ascending: false })
    .limit(5)

  let formattedRecent = []
  if (recentAttempts && recentAttempts.length > 0) {
    const userIds = Array.from(new Set(recentAttempts.map((a) => a.user_id).filter(Boolean)))
    let userMap = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)
      if (users) {
        users.forEach((u) => {
          userMap[u.id] = u
        })
      }
    }

    formattedRecent = recentAttempts.map((a) => ({
      id: a.id,
      test_title: a.mock_tests?.title || 'Mock Test',
      student_name: userMap[a.user_id]?.name || 'Student #' + (a.user_id ? a.user_id.slice(0, 5) : 'Anon'),
      score: a.score,
      total_marks: a.total_marks,
      accuracy: a.accuracy_percentage,
      submitted_at: a.submitted_at,
    }))
  }

  return {
    totalTests: testsCount.count || 0,
    publishedTests: publishedTestsCount.count || 0,
    totalAttempts: attemptsCount.count || 0,
    totalQuestions: questionsCount.count || 0,
    recentAttempts: formattedRecent,
  }
}
