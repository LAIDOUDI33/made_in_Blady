'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FolderTree,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Package,
  Image as ImageIcon,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';

// Types
interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  children?: CategoryData[];
}

// Sample data - hierarchical categories for Algerian B2B marketplace
const sampleCategories: CategoryData[] = [
  {
    id: '1',
    name: 'Informatique & IT',
    slug: 'informatique-it',
    description: 'Matériel informatique, logiciels et équipements IT',
    icon: '💻',
    sortOrder: 1,
    isActive: true,
    productCount: 156,
    children: [
      {
        id: '11',
        name: 'Ordinateurs & Portables',
        slug: 'ordinateurs-portables',
        parentId: '1',
        sortOrder: 1,
        isActive: true,
        productCount: 45,
      },
      {
        id: '12',
        name: 'Serveurs & Réseaux',
        slug: 'serveurs-reseaux',
        parentId: '1',
        sortOrder: 2,
        isActive: true,
        productCount: 38,
      },
      {
        id: '13',
        name: 'Périphériques & Accessoires',
        slug: 'peripheriques-accessoires',
        parentId: '1',
        sortOrder: 3,
        isActive: true,
        productCount: 73,
      },
    ],
  },
  {
    id: '2',
    name: 'Industrie & Manufacture',
    slug: 'industrie-manufacture',
    description: 'Machines industrielles, équipements de production',
    icon: '🏭',
    sortOrder: 2,
    isActive: true,
    productCount: 89,
    children: [
      {
        id: '21',
        name: 'Machines CNC',
        slug: 'machines-cnc',
        parentId: '2',
        sortOrder: 1,
        isActive: true,
        productCount: 24,
      },
      {
        id: '22',
        name: 'Équipements de Fabrication',
        slug: 'equipements-fabrication',
        parentId: '2',
        sortOrder: 2,
        isActive: true,
        productCount: 42,
      },
      {
        id: '23',
        name: 'Outillage Industriel',
        slug: 'outillage-industriel',
        parentId: '2',
        sortOrder: 3,
        isActive: false,
        productCount: 23,
      },
    ],
  },
  {
    id: '3',
    name: 'Agroalimentaire',
    slug: 'agroalimentaire',
    description: 'Produits alimentaires, machines agricoles',
    icon: '🌾',
    sortOrder: 3,
    isActive: true,
    productCount: 124,
    children: [
      {
        id: '31',
        name: 'Céréales & Graines',
        slug: 'cereales-graines',
        parentId: '3',
        sortOrder: 1,
        isActive: true,
        productCount: 56,
      },
      {
        id: '32',
        name: 'Machines Agricoles',
        slug: 'machines-agricoles',
        parentId: '3',
        sortOrder: 2,
        isActive: true,
        productCount: 34,
      },
    ],
  },
  {
    id: '4',
    name: 'Construction & BTP',
    slug: 'construction-btp',
    description: 'Matériaux de construction, engins de chantier',
    icon: '🏗️',
    sortOrder: 4,
    isActive: true,
    productCount: 98,
    children: [],
  },
  {
    id: '5',
    name: 'Textile & Habillement',
    slug: 'textile-habillement',
    description: 'Tissus, vêtements, accessoires mode',
    icon: '👔',
    sortOrder: 5,
    isActive: false,
    productCount: 67,
    children: [
      {
        id: '51',
        name: 'Tissus & Matières Premières',
        slug: 'tissus-matieres-premieres',
        parentId: '5',
        sortOrder: 1,
        isActive: true,
        productCount: 28,
      },
    ],
  },
];

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<CategoryData[]>(sampleCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1', '2', '3', '5']));
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [parentCategory, setParentCategory] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    isActive: true,
  });

  // Filter categories based on search
  const filteredCategories = categories.filter(cat => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return cat.name.toLowerCase().includes(query) || 
           cat.description?.toLowerCase().includes(query) ||
           cat.children?.some(child => child.name.toLowerCase().includes(query));
  });

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const openAddDialog = (parentId?: string) => {
    setFormData({ name: '', slug: '', description: '', icon: '', isActive: true });
    setParentCategory(parentId || '');
    setAddDialogOpen(true);
  };

  const openEditDialog = (category: CategoryData) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      isActive: category.isActive,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: CategoryData) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleAddCategory = () => {
    console.log('Adding category:', formData, 'Parent:', parentCategory);
    setAddDialogOpen(false);
  };

  const handleEditCategory = () => {
    console.log('Editing category:', selectedCategory?.id, formData);
    setEditDialogOpen(false);
  };

  const handleDeleteCategory = () => {
    console.log('Deleting category:', selectedCategory?.id);
    setDeleteDialogOpen(false);
  };

  const toggleCategoryActive = (categoryId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, isActive: !cat.isActive };
      }
      if (cat.children) {
        return {
          ...cat,
          children: cat.children.map(child =>
            child.id === categoryId ? { ...child, isActive: !child.isActive } : child
          )
        };
      }
      return cat;
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  // Recursive component to render category tree
  const renderCategoryItem = (category: CategoryData, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id}>
        <div 
          className={`flex items-center gap-3 py-3 px-4 hover:bg-gray-50 group ${
            !category.isActive ? 'opacity-60' : ''
          } ${level > 0 ? 'bg-gray-50/50' : ''}`}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          {/* Drag handle */}
          <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />
          
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={() => toggleCategoryExpand(category.id)}
              className="p-0.5 rounded hover:bg-gray-200"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && <span className="w-5" />}
          
          {/* Icon */}
          <span className="text-lg">{category.icon || '📁'}</span>
          
          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{category.name}</p>
            <code className="text-xs text-gray-400">/{category.slug}</code>
          </div>
          
          {/* Product count badge */}
          <Badge variant="secondary" className="gap-1">
            <Package className="h-3 w-3" />
            {category.productCount}
          </Badge>
          
          {/* Active status */}
          <Switch
            checked={category.isActive}
            onCheckedChange={() => toggleCategoryActive(category.id)}
            className="data-[state=checked]:bg-green-600"
          />
          
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => openEditDialog(category)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAddDialog(category.id)} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" /> Ajouter sous-catégorie
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleCategoryActive(category.id)} className="cursor-pointer">
                {category.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" /> Désactiver
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" /> Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => openDeleteDialog(category)} 
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive).length;
  const totalSubcategories = categories.reduce((sum, c) => sum + (c.children?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Catégories</h1>
          <p className="text-gray-500 mt-1">Organisez les catégories et sous-catégories de produits</p>
        </div>
        <Button onClick={() => openAddDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle catégorie
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCategories}</p>
                <p className="text-xs text-gray-500">Catégories principales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCategories}</p>
                <p className="text-xs text-gray-500">Actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <FolderTree className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSubcategories}</p>
                <p className="text-xs text-gray-500">Sous-catégories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tree View */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderTree className="h-5 w-5" /> Arborescence des catégories
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCategories.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredCategories.map(category => renderCategoryItem(category))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <FolderTree className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucune catégorie trouvée</h3>
              <p className="text-sm text-gray-500">Essayez une autre recherche ou ajoutez une nouvelle catégorie</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
            <DialogDescription>
              {parentCategory ? `Créer une sous-catégorie` : 'Créer une nouvelle catégorie principale'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom de la catégorie *</Label>
              <Input
                id="cat-name"
                placeholder="Ex: Électronique"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug (URL)</Label>
              <Input
                id="cat-slug"
                placeholder="electronique"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                placeholder="Description courte de la catégorie..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icône (Emoji)</Label>
                <Input
                  id="cat-icon"
                  placeholder="💻"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2 flex items-end justify-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddCategory} disabled={!formData.name.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cat-name">Nom de la catégorie *</Label>
              <Input
                id="edit-cat-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-slug">Slug (URL)</Label>
              <Input
                id="edit-cat-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-description">Description</Label>
              <Textarea
                id="edit-cat-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cat-icon">Icône (Emoji)</Label>
                <Input
                  id="edit-cat-icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2 flex items-end justify-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditCategory} disabled={!formData.name.trim()}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Supprimer la catégorie
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie &quot;{selectedCategory?.name}&quot; ?
              {selectedCategory?.children && selectedCategory.children.length > 0 && (
                <span className="block mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  ⚠️ Cette catégorie contient {selectedCategory.children.length} sous-catégorie(s). 
                  Elles seront également supprimées.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
