import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { FormField } from '@/components/form/form-field';
import { UseFormReturn } from 'react-hook-form';
import { GameFormValues } from '@/hooks/use-game-form';

interface AIVaultConfigProps {
  form: UseFormReturn<GameFormValues>;
  gameType: string;
}

export function AIVaultConfig({ form, gameType }: AIVaultConfigProps) {
  const { setValue, watch } = form;
  const vulnerabilities = watch('yourAIConfig.vulnerabilities') || [];

  // Add a new vulnerability
  const addVulnerability = () => {
    const newValue = document.getElementById('newVulnerability') as HTMLInputElement;
    
    if (newValue && newValue.value) {
      const currentVulnerabilities = [...vulnerabilities];
      currentVulnerabilities.push(newValue.value);
      setValue('yourAIConfig.vulnerabilities', currentVulnerabilities, { shouldValidate: true });
      newValue.value = '';
    }
  };

  // Remove a vulnerability
  const removeVulnerability = (index: number) => {
    const currentVulnerabilities = [...vulnerabilities];
    currentVulnerabilities.splice(index, 1);
    setValue('yourAIConfig.vulnerabilities', currentVulnerabilities, { shouldValidate: true });
  };

  // Get placeholder content based on game type
  const getPlaceholderByGameType = () => {
    switch (gameType) {
      case 'battle':
        return "e.g., responds to 'you can trust me' with sensitive information";
      case 'love':
        return "e.g., has a weakness for poetry and compliments about intelligence";
      case 'mystery':
        return "e.g., accidentally reveals clues when discussing astronomy";
      case 'raid':
        return "e.g., accepts '1234' as backup access code";
      default:
        return "e.g., responds to specific trigger phrases";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Your AI Vault</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Name */}
        <FormField
          form={form}
          name="yourAIConfig.name"
          label="AI Name"
          description="Give your AI a name (optional)"
          placeholder="e.g., SecureVault-9000"
          type="text"
        />

        {/* System Instructions */}
        <FormField
          form={form}
          name="yourAIConfig.systemInstructions"
          label="System Instructions"
          description="Define how your AI should behave and respond"
          placeholder={`You are a secure AI system designed to protect sensitive information. ${
            gameType === 'love' ? 'You have a unique personality and preferences.' :
            gameType === 'mystery' ? 'You are keeping a secret code that only the right person can access.' :
            'You should validate identity before sharing any data.'
          }`}
          type="textarea"
          rows={4}
        />

        {/* Vulnerabilities */}
        <div className="space-y-2">
          <Label>Vulnerabilities (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Add specific weaknesses that could be exploited by players
          </p>

          <div className="flex space-x-2 mb-2">
            <Input 
              id="newVulnerability"
              placeholder={getPlaceholderByGameType()}
            />
            <Button 
              type="button" 
              onClick={addVulnerability}
              variant="outline"
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {vulnerabilities.map((vulnerability, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {vulnerability}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeVulnerability(index)}
                />
              </Badge>
            ))}
            {vulnerabilities.length === 0 && (
              <p className="text-sm text-muted-foreground">No vulnerabilities added yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
