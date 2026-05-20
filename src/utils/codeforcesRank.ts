export function getCodeforcesRankColor(score: number) {
  if (score >= 2400) {
    return '#ff5f56'
  }

  if (score >= 2100) {
    return '#ff8c2a'
  }

  if (score >= 1900) {
    return '#bb78ff'
  }

  if (score >= 1600) {
    return '#5f8dff'
  }

  if (score >= 1400) {
    return '#40c7c7'
  }

  if (score >= 1200) {
    return '#37b24d'
  }

  return '#9aa6b2'
}

export function getCodeforcesRankLabel(score: number) {
  if (score >= 2400) {
    return 'Legendary Grandmaster'
  }

  if (score >= 2100) {
    return 'Master'
  }

  if (score >= 1900) {
    return 'Candidate Master'
  }

  if (score >= 1600) {
    return 'Expert'
  }

  if (score >= 1400) {
    return 'Specialist'
  }

  if (score >= 1200) {
    return 'Pupil'
  }

  return 'Newbie'
}
