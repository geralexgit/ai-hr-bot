import { useState } from 'preact/hooks'
import { createVacancy, CreateVacancyDto } from '../services/vacanciesService'

export function AddVacancy() {
  const [formData, setFormData] = useState<CreateVacancyDto>({
    title: '',
    description: '',
    requirements: {
      technicalSkills: [],
      experience: [],
      softSkills: []
    },
    evaluationWeights: {
      technicalSkills: 50,
      communication: 30,
      problemSolving: 20
    },
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createVacancy(formData)

      if (result.success) {
        window.location.href = '/vacancies'
      } else {
        setError(result.error?.message || 'Failed to create vacancy')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateRequirements = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }))
  }

  const updateEvaluationWeights = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      evaluationWeights: {
        ...prev.evaluationWeights,
        [field]: value
      }
    }))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Add New Vacancy</h1>
        <p className="text-secondary-600 mt-2">Create a new job vacancy for the HR bot system.</p>
      </div>

      <div className="card max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onInput={(e) => updateFormData('title', (e.target as HTMLInputElement).value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', (e.target as HTMLSelectElement).value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onInput={(e) => updateFormData('description', (e.target as HTMLTextAreaElement).value)}
                rows={4}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Evaluation Weights */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Evaluation Weights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Technical Skills ({formData.evaluationWeights.technicalSkills}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights.technicalSkills}
                  onInput={(e) => updateEvaluationWeights('technicalSkills', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Communication ({formData.evaluationWeights.communication}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights.communication}
                  onInput={(e) => updateEvaluationWeights('communication', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Problem Solving ({formData.evaluationWeights.problemSolving}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.evaluationWeights.problemSolving}
                  onInput={(e) => updateEvaluationWeights('problemSolving', parseInt((e.target as HTMLInputElement).value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Technical Skills</h2>
            <div className="space-y-4">
              {formData.requirements.technicalSkills.map((skill, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-secondary-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Skill Name *
                    </label>
                    <input
                      type="text"
                      value={skill.name}
                      onInput={(e) => {
                        const newSkills = [...formData.requirements.technicalSkills];
                        newSkills[index] = { ...skill, name: (e.target as HTMLInputElement).value };
                        updateRequirements('technicalSkills', newSkills);
                      }}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Python, React"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Level *
                    </label>
                    <select
                      value={skill.level}
                      onChange={(e) => {
                        const newSkills = [...formData.requirements.technicalSkills];
                        newSkills[index] = { ...skill, level: (e.target as HTMLSelectElement).value as any };
                        updateRequirements('technicalSkills', newSkills);
                      }}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Weight (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={skill.weight}
                      onInput={(e) => {
                        const newSkills = [...formData.requirements.technicalSkills];
                        newSkills[index] = { ...skill, weight: parseInt((e.target as HTMLInputElement).value) || 1 };
                        updateRequirements('technicalSkills', newSkills);
                      }}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={skill.mandatory}
                        onChange={(e) => {
                          const newSkills = [...formData.requirements.technicalSkills];
                          newSkills[index] = { ...skill, mandatory: (e.target as HTMLInputElement).checked };
                          updateRequirements('technicalSkills', newSkills);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-secondary-700">Mandatory</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newSkills = formData.requirements.technicalSkills.filter((_, i) => i !== index);
                        updateRequirements('technicalSkills', newSkills);
                      }}
                      className="px-2 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newSkills = [...formData.requirements.technicalSkills, {
                    name: '',
                    level: 'intermediate' as const,
                    mandatory: false,
                    weight: 5
                  }];
                  updateRequirements('technicalSkills', newSkills);
                }}
                className="inline-flex items-center px-4 py-2 text-sm text-primary-600 border border-primary-300 rounded-md hover:bg-primary-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Technical Skill
              </button>
            </div>
          </div>

          {/* Experience Required */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Experience Required</h2>
            <div className="space-y-4">
              {formData.requirements.experience.map((exp, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-secondary-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Domain/Area *
                    </label>
                    <input
                      type="text"
                      value={exp.domain}
                      onInput={(e) => {
                        const newExperience = [...formData.requirements.experience];
                        newExperience[index] = { ...exp, domain: (e.target as HTMLInputElement).value };
                        updateRequirements('experience', newExperience);
                      }}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Web Development, Data Science"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Minimum Years *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={exp.minimumYears}
                      onInput={(e) => {
                        const newExperience = [...formData.requirements.experience];
                        newExperience[index] = { ...exp, minimumYears: parseInt((e.target as HTMLInputElement).value) || 0 };
                        updateRequirements('experience', newExperience);
                      }}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exp.preferred}
                        onChange={(e) => {
                          const newExperience = [...formData.requirements.experience];
                          newExperience[index] = { ...exp, preferred: (e.target as HTMLInputElement).checked };
                          updateRequirements('experience', newExperience);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-secondary-700">Preferred</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newExperience = formData.requirements.experience.filter((_, i) => i !== index);
                        updateRequirements('experience', newExperience);
                      }}
                      className="px-2 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newExperience = [...formData.requirements.experience, {
                    domain: '',
                    minimumYears: 1,
                    preferred: false
                  }];
                  updateRequirements('experience', newExperience);
                }}
                className="inline-flex items-center px-4 py-2 text-sm text-primary-600 border border-primary-300 rounded-md hover:bg-primary-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Experience Requirement
              </button>
            </div>
          </div>

          {/* Soft Skills */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Soft Skills</h2>
            <input
              type="text"
              placeholder="Enter soft skills separated by commas"
              value={formData.requirements.softSkills.join(', ')}
              onInput={(e) => updateRequirements('softSkills', (e.target as HTMLInputElement).value.split(',').map(s => s.trim()))}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.location.href = '/vacancies'}
              className="px-4 py-2 text-secondary-600 border border-secondary-300 rounded-md hover:bg-secondary-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Vacancy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
