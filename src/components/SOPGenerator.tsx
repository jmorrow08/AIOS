import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  generateSOPApi,
  saveSOPApi,
  getSOPsApi,
  publishSOPApi,
  exportSOPToPDFApi,
  updateSOPApi,
  deleteSOPApi,
  type SOPDocument,
} from '@/api/sops';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  User,
  Bot,
  Search,
  Filter,
} from 'lucide-react';

interface User {
  id: string;
  role: string;
  email: string;
}

const SOPGenerator: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState<'employee' | 'client' | 'agent'>('employee');
  const [notes, setNotes] = useState('');

  // Generated SOP states
  const [generatedSOP, setGeneratedSOP] = useState<SOPDocument | null>(null);
  const [previewContent, setPreviewContent] = useState('');

  // SOP list states
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [filteredSops, setFilteredSops] = useState<SOPDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');

  // Modal states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSOP, setEditingSOP] = useState<SOPDocument | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadUser();
    loadSOPs();
  }, []);

  useEffect(() => {
    filterSOPs();
  }, [sops, searchQuery, statusFilter, audienceFilter]);

  const loadUser = async () => {
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser.user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single();
      setUser(userProfile);
    }
  };

  const loadSOPs = async () => {
    try {
      const response = await getSOPsApi();
      if (response.success && response.data) {
        setSops(response.data as SOPDocument[]);
      }
    } catch (error) {
      console.error('Error loading SOPs:', error);
    }
  };

  const filterSOPs = () => {
    let filtered = [...sops];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (sop) =>
          sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sop.topic.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sop) => sop.status === statusFilter);
    }

    // Audience filter
    if (audienceFilter !== 'all') {
      filtered = filtered.filter((sop) => sop.audience === audienceFilter);
    }

    setFilteredSops(filtered);
  };

  const handleGenerateSOP = async () => {
    if (!title.trim() || !topic.trim()) {
      alert('Please fill in both title and topic fields');
      return;
    }

    setLoading(true);
    try {
      const response = await generateSOPApi({
        title: title.trim(),
        topic: topic.trim(),
        audience,
        notes: notes.trim() || undefined,
      });

      if (response.success && response.data) {
        const sop = response.data as SOPDocument;
        setGeneratedSOP(sop);
        setPreviewContent(sop.content);
        setPreviewOpen(true);
        await loadSOPs(); // Refresh the list
      } else {
        alert('Failed to generate SOP: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating SOP:', error);
      alert('An error occurred while generating the SOP');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSOP = async () => {
    if (!generatedSOP) return;

    try {
      const response = await saveSOPApi(generatedSOP);
      if (response.success) {
        alert('SOP saved successfully!');
        setPreviewOpen(false);
        setGeneratedSOP(null);
        setPreviewContent('');
        resetForm();
        await loadSOPs();
      } else {
        alert('Failed to save SOP: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving SOP:', error);
      alert('An error occurred while saving the SOP');
    }
  };

  const handlePublishSOP = async (sopId: string) => {
    if (!user || user.role !== 'admin') {
      alert('Only administrators can publish SOPs');
      return;
    }

    try {
      const response = await publishSOPApi(sopId);
      if (response.success) {
        alert('SOP published successfully!');
        await loadSOPs();
      } else {
        alert('Failed to publish SOP: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error publishing SOP:', error);
      alert('An error occurred while publishing the SOP');
    }
  };

  const handleExportPDF = async (sopId: string) => {
    try {
      const response = await exportSOPToPDFApi(sopId);
      if (response.success && response.pdfUrl) {
        window.open(response.pdfUrl, '_blank');
      } else {
        alert('Failed to export PDF: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('An error occurred while exporting the PDF');
    }
  };

  const handleEditSOP = (sop: SOPDocument) => {
    setEditingSOP(sop);
    setEditContent(sop.content);
    setEditOpen(true);
  };

  const handleUpdateSOP = async () => {
    if (!editingSOP || !editContent.trim()) return;

    try {
      const response = await updateSOPApi(editingSOP.id!, {
        content: editContent.trim(),
      });

      if (response.success) {
        alert('SOP updated successfully!');
        setEditOpen(false);
        setEditingSOP(null);
        setEditContent('');
        await loadSOPs();
      } else {
        alert('Failed to update SOP: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating SOP:', error);
      alert('An error occurred while updating the SOP');
    }
  };

  const handleDeleteSOP = async (sopId: string) => {
    if (!confirm('Are you sure you want to delete this SOP? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await deleteSOPApi(sopId);
      if (response.success) {
        alert('SOP deleted successfully!');
        await loadSOPs();
      } else {
        alert('Failed to delete SOP: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting SOP:', error);
      alert('An error occurred while deleting the SOP');
    }
  };

  const resetForm = () => {
    setTitle('');
    setTopic('');
    setAudience('employee');
    setNotes('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending_approval':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'employee':
        return <User className="w-4 h-4" />;
      case 'client':
        return <Users className="w-4 h-4" />;
      case 'agent':
        return <Bot className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const canEditSOP = (sop: SOPDocument) => {
    if (!user) return false;
    return user.role === 'admin' || sop.created_by === user.id;
  };

  const canPublishSOP = () => {
    return user?.role === 'admin';
  };

  return (
    <div className="h-full flex flex-col bg-cosmic-dark">
      <div className="p-6 border-b border-cosmic-light">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">SOP Generator</h2>
            <p className="text-gray-400 mt-1">
              Create and manage Standard Operating Procedures with AI assistance
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="generate" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
          <TabsTrigger value="generate">Generate SOP</TabsTrigger>
          <TabsTrigger value="manage">Manage SOPs</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-cosmic-light border-cosmic-accent">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Create New SOP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    SOP Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Customer Onboarding Process"
                    className="bg-cosmic-dark text-white border-cosmic-accent"
                  />
                </div>

                <div>
                  <Label htmlFor="topic" className="text-white">
                    Topic/Process
                  </Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Client onboarding, Quality control, Data backup"
                    className="bg-cosmic-dark text-white border-cosmic-accent"
                  />
                </div>

                <div>
                  <Label htmlFor="audience" className="text-white">
                    Target Audience
                  </Label>
                  <Select value={audience} onValueChange={(value: any) => setAudience(value)}>
                    <SelectTrigger className="bg-cosmic-dark text-white border-cosmic-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Employee
                        </div>
                      </SelectItem>
                      <SelectItem value="client">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Client
                        </div>
                      </SelectItem>
                      <SelectItem value="agent">
                        <div className="flex items-center">
                          <Bot className="w-4 h-4 mr-2" />
                          Agent
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-white">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific requirements, context, or additional information..."
                    className="bg-cosmic-dark text-white border-cosmic-accent"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerateSOP}
                  disabled={loading}
                  className="w-full bg-cosmic-accent hover:bg-cosmic-highlight"
                >
                  {loading ? (
                    'Generating SOP...'
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Generate SOP
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="flex-1 p-6">
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SOPs by title or topic..."
                    className="pl-10 bg-cosmic-light text-white border-cosmic-accent"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-cosmic-light text-white border-cosmic-accent">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-cosmic-light text-white border-cosmic-accent">
                  <SelectValue placeholder="Filter by audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SOPs List */}
            <div className="grid gap-4">
              {filteredSops.map((sop) => (
                <Card key={sop.id} className="bg-cosmic-light border-cosmic-accent">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{sop.title}</h3>
                          <Badge className={getStatusColor(sop.status)}>
                            {getStatusIcon(sop.status)}
                            <span className="ml-1 capitalize">{sop.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge variant="outline" className="text-gray-300">
                            {getAudienceIcon(sop.audience)}
                            <span className="ml-1 capitalize">{sop.audience}</span>
                          </Badge>
                        </div>
                        <p className="text-gray-400 mb-2">Topic: {sop.topic}</p>
                        <p className="text-sm text-gray-500">
                          Version {sop.version} • Created{' '}
                          {new Date(sop.created_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPreviewContent(sop.content);
                            setPreviewOpen(true);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEditSOP(sop) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSOP(sop)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExportPDF(sop.id!)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {canPublishSOP() && sop.status !== 'published' && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishSOP(sop.id!)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {canEditSOP(sop) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSOP(sop.id!)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredSops.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No SOPs found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">SOP Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-cosmic-dark p-4 rounded border border-cosmic-accent">
              <pre className="text-white whitespace-pre-wrap text-sm">{previewContent}</pre>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
              <Button
                onClick={handleSaveSOP}
                className="bg-cosmic-accent hover:bg-cosmic-highlight"
              >
                Save SOP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit SOP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="bg-cosmic-dark text-white border-cosmic-accent min-h-[400px]"
              placeholder="Edit the SOP content..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSOP}
                className="bg-cosmic-accent hover:bg-cosmic-highlight"
              >
                Update SOP
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SOPGenerator;
