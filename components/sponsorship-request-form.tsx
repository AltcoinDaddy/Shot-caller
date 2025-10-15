"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Mail, 
  Globe, 
  DollarSign, 
  Palette, 
  Gift, 
  CheckCircle, 
  AlertCircle,
  Star,
  Users,
  Calendar
} from "lucide-react"

interface SponsorshipRequestFormProps {
  onSubmit?: (data: any) => void
  showDialog?: boolean
}

export function SponsorshipRequestForm({ 
  onSubmit, 
  showDialog = false 
}: SponsorshipRequestFormProps) {
  const [formData, setFormData] = useState({
    sponsorName: '',
    contactEmail: '',
    website: '',
    proposedContribution: '',
    frequency: 'monthly',
    sportPreference: 'both',
    targetAudience: '',
    logoUrl: '',
    primaryColor: '#3B82F6',
    customMessage: '',
    nftRewards: false,
    bonusRewards: false,
    exclusiveContent: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [showFormDialog, setShowFormDialog] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.sponsorName || !formData.contactEmail || !formData.proposedContribution) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const requestData = {
        sponsorName: formData.sponsorName,
        contactEmail: formData.contactEmail,
        website: formData.website,
        proposedContribution: parseFloat(formData.proposedContribution),
        tournamentPreferences: {
          frequency: formData.frequency as 'weekly' | 'monthly' | 'seasonal',
          sportPreference: formData.sportPreference as 'NBA' | 'NFL' | 'both',
          targetAudience: formData.targetAudience || 'General sports fans'
        },
        brandingRequirements: {
          logoUrl: formData.logoUrl,
          primaryColor: formData.primaryColor,
          customMessage: formData.customMessage
        },
        customRewards: {
          nftRewards: formData.nftRewards,
          bonusRewards: formData.bonusRewards,
          exclusiveContent: formData.exclusiveContent
        }
      }

      const response = await fetch('/api/sponsorship/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: result.message || 'Sponsorship request submitted successfully!'
        })
        
        // Reset form
        setFormData({
          sponsorName: '',
          contactEmail: '',
          website: '',
          proposedContribution: '',
          frequency: 'monthly',
          sportPreference: 'both',
          targetAudience: '',
          logoUrl: '',
          primaryColor: '#3B82F6',
          customMessage: '',
          nftRewards: false,
          bonusRewards: false,
          exclusiveContent: false
        })

        if (onSubmit) {
          onSubmit(requestData)
        }

        // Close dialog after success
        setTimeout(() => {
          setShowFormDialog(false)
        }, 2000)
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to submit sponsorship request'
        })
      }
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sponsorName">Company Name *</Label>
            <Input
              id="sponsorName"
              value={formData.sponsorName}
              onChange={(e) => setFormData(prev => ({ ...prev, sponsorName: e.target.value }))}
              placeholder="Your Company Name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="contact@company.com"
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>

      {/* Sponsorship Details */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Sponsorship Details
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="proposedContribution">Proposed Contribution (FLOW) *</Label>
            <Input
              id="proposedContribution"
              type="number"
              min="100"
              step="50"
              value={formData.proposedContribution}
              onChange={(e) => setFormData(prev => ({ ...prev, proposedContribution: e.target.value }))}
              placeholder="500"
              required
            />
            <div className="text-sm text-muted-foreground mt-1">
              Minimum contribution: 100 FLOW
            </div>
          </div>
          
          <div>
            <Label htmlFor="frequency">Sponsorship Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, frequency: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sportPreference">Sport Preference</Label>
            <Select value={formData.sportPreference} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, sportPreference: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NBA">NBA Only</SelectItem>
                <SelectItem value="NFL">NFL Only</SelectItem>
                <SelectItem value="both">Both NBA & NFL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="Sports fans, crypto enthusiasts..."
            />
          </div>
        </div>
      </div>

      {/* Branding Requirements */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding Requirements
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://yourcompany.com/logo.png"
            />
          </div>
          
          <div>
            <Label htmlFor="primaryColor">Primary Brand Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-16 h-10"
              />
              <Input
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="customMessage">Custom Tournament Message</Label>
          <Textarea
            id="customMessage"
            value={formData.customMessage}
            onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
            placeholder="Powered by YourCompany - Elevating Fantasy Sports"
            rows={2}
          />
        </div>
      </div>

      {/* Custom Rewards */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Custom Rewards (Optional)
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="nftRewards"
              checked={formData.nftRewards}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, nftRewards: checked as boolean }))
              }
            />
            <Label htmlFor="nftRewards" className="text-sm">
              Provide exclusive NFT rewards for winners
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bonusRewards"
              checked={formData.bonusRewards}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, bonusRewards: checked as boolean }))
              }
            />
            <Label htmlFor="bonusRewards" className="text-sm">
              Add bonus FLOW rewards for top performers
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="exclusiveContent"
              checked={formData.exclusiveContent}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, exclusiveContent: checked as boolean }))
              }
            />
            <Label htmlFor="exclusiveContent" className="text-sm">
              Provide exclusive content or experiences
            </Label>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {submitStatus.type && (
        <Alert className={submitStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {submitStatus.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {submitStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting ? "Submitting..." : "Submit Sponsorship Request"}
      </Button>
    </form>
  )

  if (showDialog) {
    return (
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Become a Sponsor
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sponsorship Request</DialogTitle>
            <DialogDescription>
              Partner with ShotCaller to reach engaged fantasy sports fans and NFT collectors
            </DialogDescription>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Star className="h-6 w-6" />
          Become a ShotCaller Sponsor
        </CardTitle>
        <CardDescription>
          Partner with us to reach engaged fantasy sports fans and NFT collectors. 
          Enhance tournaments with your brand and provide exclusive rewards.
        </CardDescription>
        
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <div className="font-semibold">Engaged Audience</div>
              <div className="text-sm text-muted-foreground">Active NFT collectors</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-8 w-8 text-green-500" />
            <div>
              <div className="font-semibold">Regular Exposure</div>
              <div className="text-sm text-muted-foreground">Weekly tournaments</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Gift className="h-8 w-8 text-purple-500" />
            <div>
              <div className="font-semibold">Custom Rewards</div>
              <div className="text-sm text-muted-foreground">Branded NFTs & bonuses</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FormContent />
      </CardContent>
    </Card>
  )
}