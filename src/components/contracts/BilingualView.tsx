'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Languages, 
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import type { Contract, ContractClause } from '@/lib/contracts';

interface BilingualViewProps {
  contract: Contract;
  language?: 'en' | 'ar' | 'fr';
}

export function BilingualView({ contract, language = 'en' }: BilingualViewProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'tabs' | 'combined'>('side-by-side');

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                {getLabel('Bilingual View', 'عرض ثنائي اللغة', 'Vue bilingue')}
              </CardTitle>
            </div>

            <Badge variant="outline" className="font-mono">
              {contract.contractNumber}
            </Badge>
          </div>

          {/* View Mode Selector */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Side by Side
            </Button>
            <Button
              variant={viewMode === 'tabs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tabs')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Tabs
            </Button>
            <Button
              variant={viewMode === 'combined' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('combined')}
            >
              Combined
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {viewMode === 'side-by-side' && (
        <SideBySideView contract={contract} />
      )}

      {viewMode === 'tabs' && (
        <TabsView contract={contract} />
      )}

      {viewMode === 'combined' && (
        <CombinedView contract={contract} />
      )}
    </div>
  );
}

// Side by side view - EN/AR or EN/FR
function SideBySideView({ contract }: { contract: Contract }) {
  const [leftLang, setLeftLang] = useState<'EN' | 'AR'>('EN');
  const [rightLang, setRightLang] = useState<'AR' | 'FR'>('AR');

  return (
    <div className="space-y-4">
      {/* Language selector */}
      <div className="flex justify-center gap-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Left:</span>
          <select 
            value={leftLang}
            onChange={(e) => setLeftLang(e.target.value as 'EN' | 'AR')}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            <option value="EN">English</option>
            <option value="AR">العربية</option>
          </select>
        </div>
        
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Right:</span>
          <select 
            value={rightLang}
            onChange={(e) => setRightLang(e.target.value as 'AR' | 'FR')}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            <option value="AR">العربية</option>
            <option value="FR">Français</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <Card>
          <CardHeader className="py-3 px-4 bg-primary/5">
            <CardTitle className="text-base">
              {leftLang === 'EN' ? 'English / الإنجليزية' : 'العربية / Arabic'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SectionBlock
              title="Subject Matter"
              content={leftLang === 'EN' ? contract.subject : contract.subjectAr}
              dir={leftLang === 'AR' ? 'rtl' : 'ltr'}
            />
            
            {(contract.clauses || []).map((clause) => (
              <ClauseBlock
                key={clause.id}
                clause={clause}
                lang={leftLang}
                dir={leftLang === 'AR' ? 'rtl' : 'ltr'}
              />
            ))}
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardHeader className="py-3 px-4 bg-blue-50 dark:bg-blue-950">
            <CardTitle className="text-base">
              {rightLang === 'AR' ? 'العربية / Arabic' : 'Français / French'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SectionBlock
              title="موضوع العقد / Objet du contrat"
              content={rightLang === 'AR' ? contract.subjectAr : contract.subjectFr}
              dir={rightLang === 'AR' ? 'rtl' : 'ltr'}
            />
            
            {(contract.clauses || []).map((clause) => (
              <ClauseBlock
                key={clause.id}
                clause={clause}
                lang={rightLang}
                dir={rightLang === 'AR' ? 'rtl' : 'ltr'}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Tabs view
function TabsView({ contract }: { contract: Contract }) {
  return (
    <Tabs defaultValue="en" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="ar">العربية</TabsTrigger>
        <TabsTrigger value="fr">Français</TabsTrigger>
      </TabsList>

      <TabsContent value="en" className="mt-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionBlock title="Subject Matter" content={contract.subject} />
            {contract.clauses?.map((clause) => (
              <ClauseBlock key={clause.id} clause={clause} lang="EN" />
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ar" className="mt-4">
        <Card>
          <CardContent className="p-6 space-y-4" dir="rtl">
            <SectionBlock title="موضوع العقد" content={contract.subjectAr} dir="rtl" />
            {contract.clauses?.map((clause) => (
              <ClauseBlock key={clause.id} clause={clause} lang="AR" dir="rtl" />
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fr" className="mt-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionBlock title="Objet du contrat" content={contract.subjectFr} />
            {contract.clauses?.map((clause) => (
              <ClauseBlock key={clause.id} clause={clause} lang="FR" />
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Combined view - all languages together
function CombinedView({ contract }: { contract: Contract }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Subject */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-3">Subject Matter / موضوع العقد / Objet du contrat</h3>
          
          <div className="grid gap-3">
            <LanguageBlock label="EN" content={contract.subject} />
            <LanguageBlock label="AR" content={contract.subjectAr} dir="rtl" />
            <LanguageBlock label="FR" content={contract.subjectFr} italic />
          </div>
        </div>

        {/* Clauses */}
        {contract.clauses?.map((clause, index) => (
          <div key={clause.id} className="border-b pb-4 last:border-b-0">
            <h4 className="font-medium mb-3">
              #{index + 1} {clause.title} / {clause.titleAr} / {clause.titleFr}
            </h4>
            
            <div className="grid gap-3">
              <LanguageBlock label="EN" content={clause.content} />
              <LanguageBlock label="AR" content={clause.contentAr} dir="rtl" />
              <LanguageBlock label="FR" content={clause.contentFr} italic />
            </div>
          </div>
        ))}

        {/* Custom clauses */}
        {contract.customClauses && contract.customClauses.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3 text-orange-600">
              Custom Clauses / البود المخصصة / Clauses personnalisées
            </h3>
            
            {contract.customClauses.map((clause, index) => (
              <div key={clause.id} className="mb-4 last:mb-0">
                <h4 className="font-medium mb-2">{clause.title}</h4>
                
                <div className="grid gap-2">
                  <LanguageBlock label="EN" content={clause.content} />
                  <LanguageBlock label="AR" content={clause.contentAr} dir="rtl" />
                  <LanguageBlock label="FR" content={clause.contentFr} italic />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper components
function SectionBlock({ 
  title, 
  content, 
  dir = 'ltr' 
}: { 
  title: string; 
  content: string; 
  dir?: 'ltr' | 'rtl';
}) {
  if (!content) return null;
  
  return (
    <div className="space-y-1">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      <p className="text-sm whitespace-pre-wrap" dir={dir}>{content}</p>
    </div>
  );
}

function ClauseBlock({ 
  clause, 
  lang, 
  dir = 'ltr' 
}: { 
  clause: ContractClause; 
  lang: 'EN' | 'AR' | 'FR'; 
  dir?: 'ltr' | 'rtl';
}) {
  const getContent = () => {
    switch (lang) {
      case 'AR': return clause.contentAr;
      case 'FR': return clause.contentFr;
      default: return clause.content;
    }
  };

  const getTitle = () => {
    switch (lang) {
      case 'AR': return clause.titleAr;
      case 'FR': return clause.titleFr;
      default: return clause.title;
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-1">
      <h4 className="font-medium text-sm">{getTitle()}</h4>
      <p className="text-sm whitespace-pre-wrap" dir={dir}>{getContent()}</p>
    </div>
  );
}

function LanguageBlock({ 
  label, 
  content, 
  dir = 'ltr',
  italic = false 
}: { 
  label: string; 
  content: string; 
  dir?: 'ltr' | 'rtl';
  italic?: boolean;
}) {
  if (!content) return null;
  
  return (
    <div className={`bg-muted/30 rounded p-3 ${dir === 'rtl' ? 'text-right' : ''}`}>
      <span className={`text-xs font-medium text-muted-foreground ${italic ? 'italic' : ''}`}>
        [{label}]
      </span>
      <p className={`text-sm mt-1 whitespace-pre-wrap ${italic ? 'italic' : ''}`} dir={dir}>
        {content}
      </p>
    </div>
  );
}

export default BilingualView;
