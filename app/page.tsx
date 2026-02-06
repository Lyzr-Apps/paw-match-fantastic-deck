'use client'

import { useState, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Loader2, Check, ChevronLeft, ChevronRight, X, MessageCircle, Send, DollarSign, Calendar, AlertCircle, TrendingUp, Sparkles, Bell, Zap } from 'lucide-react'

// TypeScript interfaces based on actual agent responses
interface CompatibilityBreakdown {
  energy_match: number
  space_compatibility: number
  experience_alignment: number
  time_requirements_match: number
  special_care_compatibility: number
}

interface AnimalMatch {
  rank?: number
  animal_name: string
  animal_id: string
  species: string
  breed: string
  age: string
  overall_compatibility_score: number
  compatibility_breakdown: CompatibilityBreakdown
  why_this_match?: string
  match_explanation?: string
  key_strengths?: string[]
  strengths?: string[]
  important_considerations?: string[]
  considerations?: string[]
  next_steps?: string[]
  recommended_next_steps?: string[]
}

interface MatchCoordinatorResult {
  match_summary: string
  adopter_profile_summary: string
  top_recommendations: AnimalMatch[]
  total_matches_found: number
  matching_insights?: {
    best_fit_category: string
    lifestyle_highlights: string[]
    preparation_recommendations: string[]
  }
}

interface AssessmentData {
  homeType: string
  hasYard: string
  yardSize: string
  otherPets: string
  petTypes: string
  workFromHomeDays: string
  hoursAway: string
  activityLevel: number
  petSpecies: string
  pastExperienceYears: string
  energyPreference: string
  openToSpecialNeeds: string
  // Financial readiness
  monthlyBudget: string
  emergencyFund: string
  petLifespanAwareness: string
  commitmentYears: string
  // Trial period
  interestedInTrial: string
  trialDuration: string
  trialFeedback: string[]
}

// Mock animal data for display
const mockAnimals = [
  {
    animal_id: 'bella_lab_5yr',
    animal_name: 'Bella',
    species: 'dog',
    breed: 'Labrador Retriever',
    age: '5 years',
    temperament: ['Energetic', 'Loyal', 'Playful'],
    specialNeeds: [],
    bio: 'Bella is a high-energy Labrador who loves outdoor activities and needs an experienced owner with a large yard.',
    imageUrl: '/placeholder-dog-1.jpg'
  },
  {
    animal_id: 'max_tabby_3yr',
    animal_name: 'Max',
    species: 'cat',
    breed: 'Tabby',
    age: '3 years',
    temperament: ['Calm', 'Affectionate', 'Independent'],
    specialNeeds: [],
    bio: 'Max is a gentle tabby cat who loves quiet companionship and is perfect for apartment living.',
    imageUrl: '/placeholder-cat-1.jpg'
  },
  {
    animal_id: 'luna_mixed_2yr',
    animal_name: 'Luna',
    species: 'dog',
    breed: 'Mixed Breed',
    age: '2 years',
    temperament: ['Friendly', 'Adaptable', 'Social'],
    specialNeeds: [],
    bio: 'Luna is a sweet mixed breed with moderate energy who adapts well to various living situations.',
    imageUrl: '/placeholder-dog-2.jpg'
  },
  {
    animal_id: 'oliver_senior_8yr',
    animal_name: 'Oliver',
    species: 'cat',
    breed: 'Siamese Mix',
    age: '8 years',
    temperament: ['Gentle', 'Quiet', 'Loving'],
    specialNeeds: ['Arthritis'],
    bio: 'Oliver is a senior cat with mild arthritis who enjoys peaceful environments and gentle affection.',
    imageUrl: '/placeholder-cat-2.jpg'
  },
  {
    animal_id: 'charlie_beagle_4yr',
    animal_name: 'Charlie',
    species: 'dog',
    breed: 'Beagle',
    age: '4 years',
    temperament: ['Curious', 'Friendly', 'Active'],
    specialNeeds: [],
    bio: 'Charlie is a playful beagle who loves exploration and is great with families.',
    imageUrl: '/placeholder-dog-3.jpg'
  },
  {
    animal_id: 'whiskers_persian_6yr',
    animal_name: 'Whiskers',
    species: 'cat',
    breed: 'Persian',
    age: '6 years',
    temperament: ['Calm', 'Regal', 'Affectionate'],
    specialNeeds: ['Requires regular grooming'],
    bio: 'Whiskers is a beautiful Persian cat who enjoys lounging and receiving gentle attention.',
    imageUrl: '/placeholder-cat-3.jpg'
  }
]

type Screen = 'welcome' | 'assessment' | 'financial' | 'trial' | 'summary' | 'results' | 'detail'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const [assessmentStep, setAssessmentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [matchResults, setMatchResults] = useState<AnimalMatch[]>([])
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalMatch | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Filter states
  const [filterSpecies, setFilterSpecies] = useState<string>('all')
  const [filterSpecialNeeds, setFilterSpecialNeeds] = useState(false)

  // Autonomous agent states
  const [autonomousSuggestions, setAutonomousSuggestions] = useState<AnimalMatch[]>([])
  const [showAutonomousPanel, setShowAutonomousPanel] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [scanningActive, setScanningActive] = useState(false)

  // Assessment form data
  const [formData, setFormData] = useState<AssessmentData>({
    homeType: '',
    hasYard: '',
    yardSize: '',
    otherPets: '',
    petTypes: '',
    workFromHomeDays: '',
    hoursAway: '',
    activityLevel: 5,
    petSpecies: '',
    pastExperienceYears: '',
    energyPreference: '',
    openToSpecialNeeds: '',
    // Financial readiness
    monthlyBudget: '',
    emergencyFund: '',
    petLifespanAwareness: '',
    commitmentYears: '',
    // Trial period
    interestedInTrial: '',
    trialDuration: '',
    trialFeedback: []
  })

  // Cost estimation state
  const [estimatedCosts, setEstimatedCosts] = useState({
    monthly: 0,
    annual: 0,
    emergency: 0
  })

  // Trial period state
  const [trialActivated, setTrialActivated] = useState(false)
  const [trialCheckIns, setTrialCheckIns] = useState<{ day: number, notes: string, concerns: string[] }[]>([])

  const totalSteps = 5

  // Autonomous scanning - runs every 30 seconds when on results/summary screens
  useEffect(() => {
    if ((currentScreen === 'results' || currentScreen === 'summary') && formData.homeType) {
      const runAutonomousScan = async () => {
        setScanningActive(true)
        const message = buildAssessmentMessage()

        try {
          const result = await callAIAgent(message, '6985995e1caa4e686dd66faf')

          if (result.success && result.response.status === 'success') {
            const data = result.response.result as MatchCoordinatorResult
            const newSuggestions = (data.top_recommendations || []).filter(
              suggestion => !matchResults.some(existing => existing.animal_id === suggestion.animal_id)
            )

            if (newSuggestions.length > 0) {
              setAutonomousSuggestions(prev => [...newSuggestions, ...prev].slice(0, 5))
              setShowAutonomousPanel(true)
            }
          }
        } catch (error) {
          console.error('Autonomous scan error:', error)
        } finally {
          setScanningActive(false)
          setLastScanTime(new Date())
        }
      }

      // Initial scan
      runAutonomousScan()

      // Set up interval for continuous scanning (every 30 seconds)
      const intervalId = setInterval(runAutonomousScan, 30000)

      return () => clearInterval(intervalId)
    }
  }, [currentScreen, formData.homeType])

  // Cost calculator based on animal type and size
  const calculateCosts = (animalType: string, size: string = 'medium') => {
    const baseCosts: { [key: string]: { monthly: number, emergency: number } } = {
      dog_small: { monthly: 125, emergency: 2000 },
      dog_medium: { monthly: 175, emergency: 3000 },
      dog_large: { monthly: 225, emergency: 4000 },
      cat_small: { monthly: 85, emergency: 1500 },
      cat_medium: { monthly: 95, emergency: 1800 }
    }

    const key = `${animalType}_${size}`
    const costs = baseCosts[key] || baseCosts[`${animalType}_medium`] || { monthly: 100, emergency: 2000 }

    setEstimatedCosts({
      monthly: costs.monthly,
      annual: costs.monthly * 12,
      emergency: costs.emergency
    })
  }

  // Build assessment message for agent
  const buildAssessmentMessage = () => {
    const messages: string[] = []
    messages.push(`Living situation: ${formData.homeType}${formData.hasYard === 'yes' ? ` with ${formData.yardSize} yard` : ' without yard'}.`)
    messages.push(`Work schedule: Work from home ${formData.workFromHomeDays} days/week, away for ${formData.hoursAway} hours on office days.`)
    messages.push(`Activity level: ${formData.activityLevel}/10 - seeking ${formData.energyPreference} energy pet.`)
    messages.push(`Experience: ${formData.pastExperienceYears} years with ${formData.petSpecies}.`)
    messages.push(`Preferences: ${formData.energyPreference} temperament, ${formData.openToSpecialNeeds === 'yes' ? 'open to' : 'not interested in'} special needs.`)
    if (formData.otherPets === 'yes') {
      messages.push(`Other pets: Yes, has ${formData.petTypes}.`)
    } else {
      messages.push(`Other pets: None currently.`)
    }

    // Add available animals
    messages.push(`\nAvailable animals: ${mockAnimals.map((a, i) =>
      `${i + 1}) ${a.animal_name} - ${a.age} ${a.breed} ${a.species}, ${a.temperament.join(', ')}, ${a.specialNeeds.length > 0 ? `special needs: ${a.specialNeeds.join(', ')}` : 'no special needs'}.`
    ).join(' ')}`)

    return messages.join(' ')
  }

  // Find matches using Match Coordinator Agent
  const findMatches = async () => {
    setLoading(true)
    const message = buildAssessmentMessage()

    try {
      const result = await callAIAgent(message, '6985995e1caa4e686dd66faf')

      if (result.success && result.response.status === 'success') {
        const data = result.response.result as MatchCoordinatorResult
        setMatchResults(data.top_recommendations || [])
        setCurrentScreen('results')
      } else {
        console.error('Agent call failed:', result.error)
        // Fallback to mock data if agent fails
        setMatchResults(mockAnimals.map((animal, index) => ({
          rank: index + 1,
          animal_name: animal.animal_name,
          animal_id: animal.animal_id,
          species: animal.species,
          breed: animal.breed,
          age: animal.age,
          overall_compatibility_score: 85 - (index * 10),
          compatibility_breakdown: {
            energy_match: 85,
            space_compatibility: 80,
            experience_alignment: 90,
            time_requirements_match: 85,
            special_care_compatibility: 75
          },
          why_this_match: `${animal.animal_name} matches your lifestyle preferences and living situation.`,
          key_strengths: animal.temperament,
          important_considerations: ['Schedule regular meet and greet', 'Prepare your home'],
          next_steps: ['Contact shelter', 'Schedule visit']
        })).slice(0, 3))
        setCurrentScreen('results')
      }
    } catch (error) {
      console.error('Error finding matches:', error)
      // Fallback
      setMatchResults(mockAnimals.map((animal, index) => ({
        rank: index + 1,
        animal_name: animal.animal_name,
        animal_id: animal.animal_id,
        species: animal.species,
        breed: animal.breed,
        age: animal.age,
        overall_compatibility_score: 85 - (index * 10),
        compatibility_breakdown: {
          energy_match: 85,
          space_compatibility: 80,
          experience_alignment: 90,
          time_requirements_match: 85,
          special_care_compatibility: 75
        },
        why_this_match: `${animal.animal_name} matches your lifestyle preferences.`,
        key_strengths: animal.temperament,
        important_considerations: ['Prepare for adoption'],
        next_steps: ['Contact shelter']
      })).slice(0, 3))
      setCurrentScreen('results')
    } finally {
      setLoading(false)
    }
  }

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setChatLoading(true)

    try {
      const context = `User's assessment: ${buildAssessmentMessage()}\n\nCurrent matches: ${matchResults.map(m => m.animal_name).join(', ')}\n\nUser question: ${userMessage}`
      const result = await callAIAgent(context, '6985995e1caa4e686dd66faf')

      if (result.success && result.response.status === 'success') {
        const responseText = result.response.result.match_summary ||
                            result.response.result.response ||
                            'I can help you find the perfect pet match!'
        setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }])
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I apologize, but I encountered an issue. Please try rephrasing your question.'
        }])
      }
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize for the error. Please try again.'
      }])
    } finally {
      setChatLoading(false)
    }
  }

  // Get compatibility color
  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getCompatibilityTextColor = (score: number) => {
    if (score >= 80) return 'text-green-700'
    if (score >= 60) return 'text-yellow-700'
    return 'text-orange-700'
  }

  // Filter matches
  const filteredMatches = matchResults.filter(match => {
    if (filterSpecies !== 'all' && match.species !== filterSpecies) return false
    if (filterSpecialNeeds) {
      const animal = mockAnimals.find(a => a.animal_id === match.animal_id)
      if (!animal || animal.specialNeeds.length === 0) return false
    }
    return true
  })

  // SCREEN 1: Welcome
  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
          <div className="max-w-2xl text-center">
            {/* Hero illustration placeholder */}
            <div className="mb-8 flex justify-center">
              <div className="w-48 h-48 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7CB69D' }}>
                <svg className="w-32 h-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>

            <h1 className="text-5xl font-bold mb-6" style={{ color: '#7CB69D' }}>
              Find Your Perfect Match
            </h1>

            <p className="text-xl mb-8 text-gray-700 leading-relaxed">
              Our AI-powered compatibility system analyzes your lifestyle, preferences, and experience
              to match you with pets that will thrive in your home. Get personalized recommendations
              based on real compatibility factors, not just preferences.
            </p>

            <Button
              size="lg"
              className="text-lg px-8 py-6 text-white"
              style={{ backgroundColor: '#E07A5F' }}
              onClick={() => setCurrentScreen('assessment')}
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // SCREEN 2: Assessment Wizard
  if (currentScreen === 'assessment') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Progress Stepper */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step < assessmentStep ? 'text-white' :
                    step === assessmentStep ? 'text-white' : 'bg-gray-200 text-gray-500'
                  }`} style={step <= assessmentStep ? { backgroundColor: '#7CB69D' } : {}}>
                    {step < assessmentStep ? <Check className="w-5 h-5" /> : step}
                  </div>
                  {step < 5 && (
                    <div className={`flex-1 h-1 mx-2 ${step < assessmentStep ? '' : 'bg-gray-200'}`}
                         style={step < assessmentStep ? { backgroundColor: '#7CB69D' } : {}} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Living</span>
              <span>Schedule</span>
              <span>Experience</span>
              <span>Preferences</span>
              <span>Environment</span>
            </div>
          </div>

          {/* Question Cards */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl" style={{ color: '#7CB69D' }}>
                {assessmentStep === 1 && 'Living Situation'}
                {assessmentStep === 2 && 'Daily Schedule'}
                {assessmentStep === 3 && 'Pet Experience'}
                {assessmentStep === 4 && 'Pet Preferences'}
                {assessmentStep === 5 && 'Home Environment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 1: Living Situation */}
              {assessmentStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">What type of home do you live in?</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={formData.homeType}
                      onChange={(e) => setFormData(prev => ({ ...prev, homeType: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Do you have yard access?</label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={formData.hasYard === 'yes' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, hasYard: 'yes' }))}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={formData.hasYard === 'no' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, hasYard: 'no' }))}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {formData.hasYard === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Yard size?</label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={formData.yardSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, yardSize: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Daily Schedule */}
              {assessmentStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">How many days per week do you work from home?</label>
                    <Input
                      type="number"
                      min="0"
                      max="7"
                      value={formData.workFromHomeDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, workFromHomeDays: e.target.value }))}
                      placeholder="0-7 days"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">On office days, how many hours are you away from home?</label>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      value={formData.hoursAway}
                      onChange={(e) => setFormData(prev => ({ ...prev, hoursAway: e.target.value }))}
                      placeholder="Hours per day"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Activity level (1 = sedentary, 10 = very active): {formData.activityLevel}
                    </label>
                    <Slider
                      value={[formData.activityLevel]}
                      onValueChange={(values) => setFormData(prev => ({ ...prev, activityLevel: values[0] }))}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* Step 3: Experience */}
              {assessmentStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">What type of pet(s) have you owned before?</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={formData.petSpecies}
                      onChange={(e) => setFormData(prev => ({ ...prev, petSpecies: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="dogs">Dogs</option>
                      <option value="cats">Cats</option>
                      <option value="both">Both dogs and cats</option>
                      <option value="other">Other pets</option>
                      <option value="none">No prior experience</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">How many years of pet ownership experience?</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.pastExperienceYears}
                      onChange={(e) => setFormData(prev => ({ ...prev, pastExperienceYears: e.target.value }))}
                      placeholder="Years"
                    />
                  </div>
                </>
              )}

              {/* Step 4: Preferences */}
              {assessmentStep === 4 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">What energy level do you prefer in a pet?</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={formData.energyPreference}
                      onChange={(e) => setFormData(prev => ({ ...prev, energyPreference: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option value="low">Low - calm and relaxed</option>
                      <option value="moderate">Moderate - balanced activity</option>
                      <option value="high">High - active and playful</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Are you open to adopting a pet with special needs?</label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={formData.openToSpecialNeeds === 'yes' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, openToSpecialNeeds: 'yes' }))}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={formData.openToSpecialNeeds === 'no' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, openToSpecialNeeds: 'no' }))}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 5: Environment */}
              {assessmentStep === 5 && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Do you currently have other pets?</label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={formData.otherPets === 'yes' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, otherPets: 'yes' }))}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={formData.otherPets === 'no' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, otherPets: 'no' }))}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {formData.otherPets === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">What types of pets do you have?</label>
                      <Input
                        value={formData.petTypes}
                        onChange={(e) => setFormData(prev => ({ ...prev, petTypes: e.target.value }))}
                        placeholder="e.g., 1 dog, 2 cats"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (assessmentStep > 1) {
                      setAssessmentStep(assessmentStep - 1)
                    } else {
                      setCurrentScreen('welcome')
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                {assessmentStep < totalSteps ? (
                  <Button
                    onClick={() => setAssessmentStep(assessmentStep + 1)}
                    style={{ backgroundColor: '#7CB69D' }}
                    className="text-white"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentScreen('financial')}
                    style={{ backgroundColor: '#7CB69D' }}
                    className="text-white"
                  >
                    Continue to Financial Check
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // SCREEN 3: Financial Readiness Check
  if (currentScreen === 'financial') {
    // Calculate estimated costs when entering this screen
    if (estimatedCosts.monthly === 0 && formData.energyPreference) {
      const petType = formData.energyPreference.includes('dog') ? 'dog' : 'cat'
      calculateCosts(petType, 'medium')
    }

    const financiallyReady =
      Number(formData.monthlyBudget) >= estimatedCosts.monthly &&
      formData.emergencyFund === 'yes' &&
      formData.petLifespanAwareness !== ''

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7CB69D' }}>
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl" style={{ color: '#7CB69D' }}>
                  Financial & Commitment Readiness
                </CardTitle>
              </div>
              <p className="text-gray-600">Financial strain causes 20-30% of pet returns. Let's ensure you're prepared for the long-term commitment.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cost Estimator Tool */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#F0F7F4' }}>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: '#7CB69D' }} />
                  Estimated Annual Costs
                </h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Monthly</p>
                    <p className="text-2xl font-bold" style={{ color: '#7CB69D' }}>
                      ${estimatedCosts.monthly}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Food, supplies, routine care</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Annual</p>
                    <p className="text-2xl font-bold" style={{ color: '#7CB69D' }}>
                      ${estimatedCosts.annual}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total yearly expenses</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Emergency Fund</p>
                    <p className="text-2xl font-bold" style={{ color: '#E07A5F' }}>
                      ${estimatedCosts.emergency}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Recommended reserve</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic">
                  Costs vary by breed, size, age, and health needs. This is a baseline estimate.
                </p>
              </div>

              {/* Budget Assessment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  What is your monthly budget for pet care? (food, supplies, routine vet visits)
                </label>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    min="0"
                    value={formData.monthlyBudget}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyBudget: e.target.value }))}
                    placeholder="Monthly budget in USD"
                    className="flex-1"
                  />
                </div>
                {formData.monthlyBudget && Number(formData.monthlyBudget) < estimatedCosts.monthly && (
                  <div className="flex items-start gap-2 mt-2 p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-700">
                      Your budget is below the estimated monthly cost of ${estimatedCosts.monthly}. Consider adjusting or choosing a lower-cost pet option.
                    </p>
                  </div>
                )}
              </div>

              {/* Emergency Fund */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Do you have an emergency fund of at least ${estimatedCosts.emergency} for unexpected vet bills?
                </label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.emergencyFund === 'yes' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, emergencyFund: 'yes' }))}
                    style={formData.emergencyFund === 'yes' ? { backgroundColor: '#7CB69D' } : {}}
                    className={formData.emergencyFund === 'yes' ? 'text-white' : ''}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={formData.emergencyFund === 'no' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, emergencyFund: 'no' }))}
                  >
                    No
                  </Button>
                  <Button
                    type="button"
                    variant={formData.emergencyFund === 'working-on-it' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, emergencyFund: 'working-on-it' }))}
                  >
                    Working on it
                  </Button>
                </div>
              </div>

              {/* Lifespan Awareness Quiz */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  How long is the typical lifespan of the pet you're considering?
                </label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formData.petLifespanAwareness}
                  onChange={(e) => setFormData(prev => ({ ...prev, petLifespanAwareness: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10-15">10-15 years</option>
                  <option value="15-20">15-20 years</option>
                  <option value="20+">20+ years</option>
                </select>
                {formData.petLifespanAwareness && (
                  <p className="text-sm text-gray-600 mt-2">
                    {formData.petLifespanAwareness === '10-15' || formData.petLifespanAwareness === '15-20' ?
                      'Correct! Most dogs live 10-15 years, while cats often live 15-20 years. This is a long-term commitment.' :
                      'Typical lifespans: Dogs 10-15 years, Cats 15-20 years. Be prepared for this commitment.'}
                  </p>
                )}
              </div>

              {/* Commitment Years */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Can you commit to caring for a pet for the next 10-20 years?
                </label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.commitmentYears === 'yes' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, commitmentYears: 'yes' }))}
                    style={formData.commitmentYears === 'yes' ? { backgroundColor: '#7CB69D' } : {}}
                    className={formData.commitmentYears === 'yes' ? 'text-white' : ''}
                  >
                    Yes, absolutely
                  </Button>
                  <Button
                    type="button"
                    variant={formData.commitmentYears === 'uncertain' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, commitmentYears: 'uncertain' }))}
                  >
                    Uncertain
                  </Button>
                  <Button
                    type="button"
                    variant={formData.commitmentYears === 'no' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, commitmentYears: 'no' }))}
                  >
                    No
                  </Button>
                </div>
              </div>

              {/* Readiness Summary */}
              {formData.monthlyBudget && formData.emergencyFund && formData.commitmentYears && (
                <div className={`p-4 rounded-lg ${financiallyReady ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <div className="flex items-start gap-3">
                    {financiallyReady ? (
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-semibold mb-1 ${financiallyReady ? 'text-green-800' : 'text-yellow-800'}`}>
                        {financiallyReady ? 'Financially Ready!' : 'Consider These Points'}
                      </h4>
                      <p className={`text-sm ${financiallyReady ? 'text-green-700' : 'text-yellow-700'}`}>
                        {financiallyReady
                          ? 'You appear financially prepared for pet ownership. Continue to the trial period option.'
                          : 'Review your budget and emergency fund. Consider starting with a lower-cost pet or waiting until you\'re more financially prepared.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentScreen('assessment')}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Assessment
                </Button>

                <Button
                  onClick={() => setCurrentScreen('trial')}
                  style={{ backgroundColor: '#7CB69D' }}
                  className="text-white"
                >
                  Continue to Trial Period
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // SCREEN 4: Trial Period Simulation
  if (currentScreen === 'trial') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7CB69D' }}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl" style={{ color: '#7CB69D' }}>
                  Trial Period Preview
                </CardTitle>
              </div>
              <p className="text-gray-600">Test compatibility without full commitment. Real-world exposure reveals hidden issues like allergies or behavioral mismatches.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trial Period Explanation */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#F0F7F4' }}>
                <h3 className="font-semibold text-lg mb-3">How Trial Periods Work</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#7CB69D' }}>
                      1
                    </div>
                    <div>
                      <p className="font-medium">Short-term Fostering</p>
                      <p className="text-sm text-gray-600">Take a pet home for a trial weekend (2-7 days) to experience daily life together</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#7CB69D' }}>
                      2
                    </div>
                    <div>
                      <p className="font-medium">Daily Check-ins</p>
                      <p className="text-sm text-gray-600">Complete guided feedback forms via our app to track compatibility</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#7CB69D' }}>
                      3
                    </div>
                    <div>
                      <p className="font-medium">Informed Decision</p>
                      <p className="text-sm text-gray-600">Decide to adopt or return without pressure, preventing future returns</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interest in Trial */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Would you be interested in a trial period before finalizing adoption?
                </label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.interestedInTrial === 'yes' ? 'default' : 'outline'}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, interestedInTrial: 'yes' }))
                      setTrialActivated(false)
                    }}
                    style={formData.interestedInTrial === 'yes' ? { backgroundColor: '#7CB69D' } : {}}
                    className={formData.interestedInTrial === 'yes' ? 'text-white' : ''}
                  >
                    Yes, I'd like to try
                  </Button>
                  <Button
                    type="button"
                    variant={formData.interestedInTrial === 'no' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, interestedInTrial: 'no' }))}
                  >
                    No, skip trial
                  </Button>
                </div>
              </div>

              {/* Trial Duration Selection */}
              {formData.interestedInTrial === 'yes' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preferred trial duration?
                  </label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={formData.trialDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, trialDuration: e.target.value }))}
                  >
                    <option value="">Select duration...</option>
                    <option value="weekend">Weekend (2-3 days)</option>
                    <option value="week">One week (7 days)</option>
                    <option value="two-weeks">Two weeks (14 days)</option>
                  </select>
                </div>
              )}

              {/* Simulate Trial Check-in */}
              {formData.interestedInTrial === 'yes' && formData.trialDuration && !trialActivated && (
                <div className="p-4 bg-white border-2 border-dashed rounded-lg" style={{ borderColor: '#7CB69D' }}>
                  <h4 className="font-semibold mb-2">Preview Trial Experience</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Click below to simulate what a trial weekend check-in would look like
                  </p>
                  <Button
                    onClick={() => setTrialActivated(true)}
                    style={{ backgroundColor: '#E07A5F' }}
                    className="text-white"
                  >
                    Start Trial Simulation
                  </Button>
                </div>
              )}

              {/* Trial Simulation Form */}
              {trialActivated && (
                <div className="p-6 bg-white border-2 rounded-lg" style={{ borderColor: '#7CB69D' }}>
                  <h4 className="font-semibold text-lg mb-4">Day 2 Check-in Form</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">How is the pet adjusting to your home?</label>
                      <select className="w-full border rounded-md p-2 text-sm">
                        <option>Excellent - very comfortable</option>
                        <option>Good - settling in well</option>
                        <option>Fair - some nervousness</option>
                        <option>Poor - struggling to adjust</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Any concerns so far? (Check all that apply)</label>
                      <div className="space-y-2">
                        {['Allergies or reactions', 'Behavioral issues', 'Energy level mismatch', 'Space constraints', 'Time commitment', 'None'].map((concern) => (
                          <label key={concern} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            {concern}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Additional notes:</label>
                      <textarea
                        className="w-full border rounded-md p-2 text-sm"
                        rows={3}
                        placeholder="Share any observations, concerns, or positive experiences..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        style={{ backgroundColor: '#7CB69D' }}
                        className="text-white"
                        onClick={() => {
                          setTrialActivated(false)
                          alert('Check-in submitted! In a real trial, this feedback helps match coordinators support you.')
                        }}
                      >
                        Submit Check-in
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTrialActivated(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits Highlight */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">Why Trial Periods Matter</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Reduces return rates by revealing compatibility issues early</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Tests for allergies and behavioral fit in real conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Gives you confidence before making the final commitment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Shelter receives feedback to better match future adopters</span>
                  </li>
                </ul>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentScreen('financial')}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Financial Check
                </Button>

                <Button
                  onClick={() => setCurrentScreen('summary')}
                  style={{ backgroundColor: '#7CB69D' }}
                  className="text-white"
                >
                  Review Summary
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // SCREEN 5: Assessment Summary
  if (currentScreen === 'summary') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl" style={{ color: '#7CB69D' }}>
                Assessment Summary
              </CardTitle>
              <p className="text-gray-600">Review your information before finding matches</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Living Situation */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3" style={{ color: '#7CB69D' }}>Living Situation</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Home Type:</span> {formData.homeType || 'Not specified'}</p>
                    <p><span className="font-medium">Yard Access:</span> {formData.hasYard === 'yes' ? `Yes (${formData.yardSize})` : 'No'}</p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3" style={{ color: '#7CB69D' }}>Daily Schedule</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">WFH Days:</span> {formData.workFromHomeDays}/week</p>
                    <p><span className="font-medium">Hours Away:</span> {formData.hoursAway} hours</p>
                    <p><span className="font-medium">Activity Level:</span> {formData.activityLevel}/10</p>
                  </div>
                </div>

                {/* Experience */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3" style={{ color: '#7CB69D' }}>Experience</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Past Pets:</span> {formData.petSpecies || 'Not specified'}</p>
                    <p><span className="font-medium">Years:</span> {formData.pastExperienceYears || '0'}</p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3" style={{ color: '#7CB69D' }}>Preferences</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Energy:</span> {formData.energyPreference || 'Not specified'}</p>
                    <p><span className="font-medium">Special Needs:</span> {formData.openToSpecialNeeds === 'yes' ? 'Open' : 'Not interested'}</p>
                  </div>
                </div>

                {/* Environment */}
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                  <h3 className="font-semibold mb-3" style={{ color: '#7CB69D' }}>Current Environment</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Other Pets:</span> {formData.otherPets === 'yes' ? formData.petTypes : 'None'}</p>
                  </div>
                </div>

                {/* Financial Readiness */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3" style={{ color: '#7CB69D' }}>Financial Readiness</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Monthly Budget:</span> ${formData.monthlyBudget || 'Not specified'}</p>
                    <p><span className="font-medium">Emergency Fund:</span> {formData.emergencyFund === 'yes' ? 'Yes' : formData.emergencyFund === 'no' ? 'No' : 'Working on it'}</p>
                    <p><span className="font-medium">Lifespan Awareness:</span> {formData.petLifespanAwareness || 'Not specified'}</p>
                    <p><span className="font-medium">Long-term Commitment:</span> {formData.commitmentYears === 'yes' ? 'Committed' : formData.commitmentYears === 'uncertain' ? 'Uncertain' : 'No'}</p>
                  </div>
                </div>

                {/* Trial Period Interest */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3" style={{ color: '#7CB69D' }}>Trial Period</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Interested in Trial:</span> {formData.interestedInTrial === 'yes' ? 'Yes' : 'No'}</p>
                    {formData.interestedInTrial === 'yes' && (
                      <p><span className="font-medium">Preferred Duration:</span> {formData.trialDuration ? formData.trialDuration.charAt(0).toUpperCase() + formData.trialDuration.slice(1) : 'Not specified'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentScreen('trial')}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Trial Period
                </Button>

                <Button
                  size="lg"
                  className="text-white"
                  style={{ backgroundColor: '#E07A5F' }}
                  onClick={findMatches}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing compatibility...
                    </>
                  ) : (
                    'Find My Match'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // SCREEN 6: Match Results Dashboard
  if (currentScreen === 'results') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <div className="container mx-auto px-4 py-8">
          {/* Autonomous Suggestions Panel */}
          {showAutonomousPanel && autonomousSuggestions.length > 0 && (
            <div className="mb-6 relative">
              <Card className="border-2" style={{ borderColor: '#7CB69D', backgroundColor: '#F0F7F4' }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7CB69D' }}>
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: '#7CB69D' }}>
                          New Matches Found!
                        </h3>
                        <p className="text-sm text-gray-600">
                          {scanningActive ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Scanning for new arrivals...
                            </span>
                          ) : (
                            `Last scanned: ${lastScanTime ? new Date(lastScanTime).toLocaleTimeString() : 'Just now'}`
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAutonomousPanel(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {autonomousSuggestions.slice(0, 3).map((suggestion) => {
                      const mockAnimal = mockAnimals.find(a => a.animal_id === suggestion.animal_id)
                      return (
                        <div key={suggestion.animal_id} className="bg-white p-3 rounded-lg border-2 border-dashed" style={{ borderColor: '#7CB69D' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-2xl">
                              {suggestion.species === 'dog' ? '🐕' : '🐱'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{suggestion.animal_name}</h4>
                              <p className="text-xs text-gray-600">{suggestion.breed}</p>
                            </div>
                            <div className="px-2 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: '#7CB69D' }}>
                              {suggestion.overall_compatibility_score}%
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full text-white text-xs"
                            style={{ backgroundColor: '#E07A5F' }}
                            onClick={() => {
                              setSelectedAnimal(suggestion)
                              setCurrentScreen('detail')
                              setShowAutonomousPanel(false)
                            }}
                          >
                            View Match
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  {autonomousSuggestions.length > 3 && (
                    <p className="text-xs text-center text-gray-600 mt-3">
                      +{autonomousSuggestions.length - 3} more autonomous suggestions available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#7CB69D' }}>Your Perfect Matches</h1>
                <p className="text-gray-600">Based on your lifestyle and preferences</p>
              </div>
              {/* Autonomous Scan Status Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border">
                <Zap className="w-4 h-4" style={{ color: '#7CB69D' }} />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Auto-Scan Active</p>
                  <p className="text-xs text-gray-500">Checking for new arrivals</p>
                </div>
                {autonomousSuggestions.length > 0 && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#E07A5F' }}>
                    {autonomousSuggestions.length}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trial Period Reminder */}
          {formData.interestedInTrial === 'yes' && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Trial Period Available</h3>
                  <p className="text-sm text-blue-800">
                    You indicated interest in a {formData.trialDuration} trial period. When contacting the shelter about any match,
                    ask about their trial fostering program to test compatibility before finalizing adoption.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <div className="w-64 flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Species</label>
                    <select
                      className="w-full border rounded-md p-2 text-sm"
                      value={filterSpecies}
                      onChange={(e) => setFilterSpecies(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="dog">Dogs</option>
                      <option value="cat">Cats</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="specialNeeds"
                      checked={filterSpecialNeeds}
                      onChange={(e) => setFilterSpecialNeeds(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="specialNeeds" className="text-sm">Special needs only</label>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilterSpecies('all')
                      setFilterSpecialNeeds(false)
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>

              {/* Chat Widget */}
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" style={{ color: '#7CB69D' }} />
                      <CardTitle className="text-lg">Ask Questions</CardTitle>
                    </div>
                    {chatOpen && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {chatOpen ? (
                  <CardContent className="space-y-3">
                    <div className="h-64 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded">
                      {chatMessages.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          Ask me anything about your matches!
                        </p>
                      ) : (
                        chatMessages.map((msg, idx) => (
                          <div key={idx} className={`p-2 rounded text-sm ${
                            msg.role === 'user'
                              ? 'bg-white ml-4'
                              : 'mr-4'
                          }`} style={msg.role === 'assistant' ? { backgroundColor: '#7CB69D', color: 'white' } : {}}>
                            {msg.content}
                          </div>
                        ))
                      )}
                      {chatLoading && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Thinking...
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={sendChatMessage}
                        disabled={chatLoading || !chatInput.trim()}
                        style={{ backgroundColor: '#7CB69D' }}
                        className="text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setChatOpen(true)}
                    >
                      Start Chat
                    </Button>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Main Content - Match Cards */}
            <div className="flex-1">
              {filteredMatches.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-gray-500">No matches found with current filters.</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.map((match) => {
                    const mockAnimal = mockAnimals.find(a => a.animal_id === match.animal_id)
                    const score = match.overall_compatibility_score

                    return (
                      <Card key={match.animal_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Animal Image Placeholder */}
                        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <div className="text-6xl">
                            {match.species === 'dog' ? '🐕' : '🐱'}
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-lg">{match.animal_name}</h3>
                              <p className="text-sm text-gray-600">{match.breed}</p>
                              <p className="text-sm text-gray-500">{match.age}</p>
                            </div>

                            {/* Compatibility Badge */}
                            <div className={`px-3 py-1 rounded-full text-white font-bold text-sm ${getCompatibilityColor(score)}`}>
                              {score}%
                            </div>
                          </div>

                          {/* Key Factors */}
                          <div className="space-y-1 mb-4">
                            {(match.key_strengths || match.strengths || []).slice(0, 3).map((strength, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#7CB69D' }} />
                                <span className="text-sm text-gray-700">{strength}</span>
                              </div>
                            ))}
                          </div>

                          <Button
                            className="w-full text-white"
                            style={{ backgroundColor: '#E07A5F' }}
                            onClick={() => {
                              setSelectedAnimal(match)
                              setCurrentScreen('detail')
                            }}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // SCREEN 7: Compatibility Detail
  if (currentScreen === 'detail' && selectedAnimal) {
    const mockAnimal = mockAnimals.find(a => a.animal_id === selectedAnimal.animal_id)
    const breakdown = selectedAnimal.compatibility_breakdown

    const categoryLabels = {
      energy_match: 'Energy Match',
      space_compatibility: 'Space Fit',
      experience_alignment: 'Experience Alignment',
      time_requirements_match: 'Time Commitment',
      special_care_compatibility: 'Lifestyle Sync'
    }

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => setCurrentScreen('results')}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Button>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Animal Profile */}
            <div>
              <Card>
                <CardContent className="p-6">
                  {/* Animal Image */}
                  <div className="h-80 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-6">
                    <div className="text-9xl">
                      {selectedAnimal.species === 'dog' ? '🐕' : '🐱'}
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#7CB69D' }}>
                    {selectedAnimal.animal_name}
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    {selectedAnimal.breed} • {selectedAnimal.age}
                  </p>

                  {/* Bio */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-gray-700">{mockAnimal?.bio || 'A wonderful companion looking for a loving home.'}</p>
                  </div>

                  {/* Temperament Tags */}
                  {mockAnimal && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Temperament</h3>
                      <div className="flex flex-wrap gap-2">
                        {mockAnimal.temperament.map((trait, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full text-sm text-white" style={{ backgroundColor: '#7CB69D' }}>
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Needs */}
                  {mockAnimal && mockAnimal.specialNeeds.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Special Needs</h3>
                      <div className="space-y-1">
                        {mockAnimal.specialNeeds.map((need, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E07A5F' }} />
                            <span className="text-sm">{need}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Compatibility Analysis */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Compatibility Analysis</CardTitle>
                    <div className={`text-4xl font-bold ${getCompatibilityTextColor(selectedAnimal.overall_compatibility_score)}`}>
                      {selectedAnimal.overall_compatibility_score}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Recommendation */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">
                      {selectedAnimal.why_this_match || selectedAnimal.match_explanation || 'This pet is a great match for your lifestyle!'}
                    </p>
                  </div>

                  {/* Compatibility Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-4">Compatibility Breakdown</h3>
                    <div className="space-y-4">
                      {Object.entries(breakdown).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">
                              {categoryLabels[key as keyof typeof categoryLabels]}
                            </span>
                            <span className={`text-sm font-bold ${getCompatibilityTextColor(value)}`}>
                              {value}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getCompatibilityColor(value)}`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Strengths */}
                  <div>
                    <h3 className="font-semibold mb-3">Key Strengths</h3>
                    <div className="space-y-2">
                      {(selectedAnimal.key_strengths || selectedAnimal.strengths || []).map((strength, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Considerations */}
                  {(selectedAnimal.important_considerations || selectedAnimal.considerations || []).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Important Considerations</h3>
                      <div className="space-y-2">
                        {(selectedAnimal.important_considerations || selectedAnimal.considerations || []).map((consideration, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#E07A5F' }} />
                            <span className="text-sm">{consideration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div>
                    <h3 className="font-semibold mb-3">Recommended Next Steps</h3>
                    <div className="space-y-2">
                      {(selectedAnimal.next_steps || selectedAnimal.recommended_next_steps || []).map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#7CB69D' }}>
                            {idx + 1}
                          </div>
                          <span className="text-sm pt-1">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 text-white" style={{ backgroundColor: '#E07A5F' }}>
                      Contact Shelter
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Save to Favorites
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
