"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePredictionMarket } from "@/hooks/use-prediction-market";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface CreatePredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPredictionCreated: () => void;
}

export function CreatePredictionDialog({ 
  open, 
  onOpenChange,
  onPredictionCreated
}: CreatePredictionDialogProps) {
  const { createPrediction, isCreatingPrediction } = usePredictionMarket();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [stake, setStake] = useState("");
  
  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setStake("");
    }
    onOpenChange(open);
  };
  
  // Add a new option
  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    } else {
      toast.error("Maximum 10 options allowed");
    }
  };
  
  // Remove an option
  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    } else {
      toast.error("Minimum 2 options required");
    }
  };
  
  // Update an option
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  // Validate form
  const isFormValid = () => {
    return (
      title.trim() !== "" && 
      description.trim() !== "" && 
      options.every(opt => opt.trim() !== "") && 
      stake.trim() !== "" &&
      parseFloat(stake) > 0
    );
  };
  
  // Create prediction
  const handleCreatePrediction = async () => {
    if (!isFormValid()) return;
    
    // Filter out any empty options
    const filteredOptions = options.filter(opt => opt.trim() !== "");
    
    // Call the contract to create a prediction
    const success = await createPrediction(
      title,
      description,
      filteredOptions,
      Number(stake)
    );
    
    if (success) {
      handleOpenChange(false);
      onPredictionCreated();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Prediction</DialogTitle>
          <DialogDescription>
            Create a prediction market where users can bet on different outcomes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Will BTC reach $100k by end of 2025?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Prediction on whether Bitcoin will reach $100,000 USD by December 31, 2025."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Options (2-10)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addOption}
                disabled={options.length >= 10}
                className="h-8 px-2"
              >
                <Plus size={16} className="mr-1" />
                Add Option
              </Button>
            </div>
            
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                {options.length > 2 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeOption(index)}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stake">Initial Stake (tCORE)</Label>
            <Input
              id="stake"
              type="number"
              placeholder="1.0"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              min="0.01"
              step="0.01"
            />
            <p className="text-sm text-muted-foreground">
              This amount will be staked as the initial liquidity for the prediction market.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleCreatePrediction}
            disabled={isCreatingPrediction || !isFormValid()}
          >
            {isCreatingPrediction ? (
              <LoadingSpinner size="sm" text="Creating..." />
            ) : (
              "Create Prediction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 