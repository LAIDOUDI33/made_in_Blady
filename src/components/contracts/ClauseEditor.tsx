'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Unlock, 
  Trash2,
  Edit3,
  Eye,
  GripVertical
} from 'lucide-react';
import type { ContractClause } from '@/lib/contracts';

interface ClauseEditorProps {
  clause: ContractClause;
  onChange: (updates: Partial<ContractClause>) => void;
  readOnly?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  language?: 'en' | 'ar' | 'fr';
}

export function ClauseEditor({
  clause,
  onChange,
  readOnly = false,
  canDelete = false,
  onDelete,
  language = 'en',
}: ClauseEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState({
    content: clause.content,
    contentAr: clause.contentAr,
    contentFr: clause.contentFr,
  });

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const handleSaveEdit = () => {
    onChange(editContent);
    setIsEditing(false);
  };

  return (
    <Card className={`w-full ${clause.isRequired ? 'border-l-4 border-l-primary' : ''}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">
                #{clause.order} {getLabel(clause.title, clause.titleAr, clause.titleFr)}
              </span>
              
              <Badge variant="outline" className="text-xs shrink-0">
                {clause.clauseType}
              </Badge>
              
              {clause.isRequired && (
                <Badge variant="secondary" className="text-xs shrink-0 bg-red-50 text-red-600 border-red-200">
                  Required
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {!readOnly && clause.isEditable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {isEditing ? (
            /* Editing Mode */
            <div className="space-y-3">
              {/* English Content */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  English / الإنجليزية
                </label>
                <Textarea
                  value={editContent.content}
                  onChange={(e) => setEditContent(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Arabic Content */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  العربية / Arabic
                </label>
                <Textarea
                  value={editContent.contentAr}
                  onChange={(e) => setEditContent(prev => ({ ...prev, contentAr: e.target.value }))}
                  rows={3}
                  className="text-sm"
                  dir="rtl"
                />
              </div>

              {/* French Content */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Français / French
                </label>
                <Textarea
                  value={editContent.contentFr}
                  onChange={(e) => setEditContent(prev => ({ ...prev, contentFr: e.target.value }))}
                  rows={3}
                  className="text-sm italic"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-3">
              {/* English */}
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-1">EN</p>
                <p className="text-sm whitespace-pre-wrap">{clause.content}</p>
              </div>

              {/* Arabic */}
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-1">AR</p>
                <p className="text-sm whitespace-pre-wrap" dir="rtl">{clause.contentAr}</p>
              </div>

              {/* French */}
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-1">FR</p>
                <p className="text-sm whitespace-pre-wrap italic">{clause.contentFr}</p>
              </div>

              {/* Status indicators */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {clause.isEditable ? (
                    <><Unlock className="h-3 w-3" /> Editable</>
                  ) : (
                    <><Lock className="h-3 w-3" /> Locked</>
                  )}
                </div>
                
                {clause.isRequired && (
                  <span className="text-xs text-orange-600">
                    This clause cannot be removed
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default ClauseEditor;
