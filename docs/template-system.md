# Template System Documentation

## Overview

The template system is a comprehensive document generation platform that allows users to create, manage, and use HTML-based document templates with AI-powered content generation. The system supports multi-tenant architecture with proper isolation and provides both user-facing and admin interfaces.

## Architecture

### Core Components

1. **Database Layer** (`lib/database/templates.ts`)
   - Supabase integration for template storage
   - CRUD operations with tenant isolation
   - Row Level Security (RLS) policies
   - Line break normalization for proper HTML formatting

2. **Server Actions** (`app/actions/templates.ts`)
   - Server-side template operations
   - Authentication and authorization
   - Error handling and validation
   - Tenant-based template access

3. **Frontend Components**
   - Template selection page (`app/templates/page.tsx`)
   - Template editor (`app/templates/[id]/page.tsx`)
   - Admin management (`app/admin/templates/page.tsx`)
   - Template population with controlled form inputs

4. **AI Integration** (`app/api/generate-document/route.ts`)
   - Google Gemini AI for JSON content generation
   - Smart field detection and formatting strategies
   - Returns structured data for frontend template population

## Database Schema

### Templates Table

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  fields JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security

```sql
-- Users can only access templates from their tenant
CREATE POLICY "Users can only access templates from their tenant" ON templates
  FOR ALL USING (
    tenant_id = (SELECT auth.jwt() ->> 'tenantId')::uuid
  );
```

## Template Structure

### HTML Content

Templates use HTML with variable substitution syntax. Variables are enclosed in double curly braces:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{Company Name}} - Document</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{Company Name}}</h1>
        <p>{{Description}}</p>
    </div>
    <div class="content">
        <h2>Content</h2>
        <p>{{Solution}}</p>
    </div>
</body>
</html>
```

### Variable Types

The system supports different variable types with special formatting:

1. **Text Variables**: `{{Variable Name}}`
   - Basic text replacement
   - Used for simple content like names, titles

2. **Formatted Variables**: `{{type:Variable Name}}`
   - **Points**: `{{points:Key Points}}` - Generates bullet points
   - **Table**: `{{table:Data Table}}` - Generates CSV table format
   - **Paragraphs**: `{{paragraphs:Content}}` - Generates multiple paragraphs
   - **Bold**: `{{bold:Important Text}}` - Emphasized text
   - **Italic**: `{{italic:Subtitle}}` - Italicized text
   - **Heading**: `{{heading:Section Title}}` - Sub-heading format

### Template Fields

Each template defines fields that users can fill out:

```typescript
interface TemplateField {
  key: string;           // Variable name in HTML (e.g., "Company Name")
  name: string;          // Display name for the form
  type: "input" | "textarea";  // Form input type
  placeholder: string;   // Placeholder text
}
```

Example fields array:
```json
[
  {
    "key": "Company Name",
    "name": "Company Name", 
    "type": "input",
    "placeholder": "Enter your company name"
  },
  {
    "key": "Description",
    "name": "Description",
    "type": "textarea", 
    "placeholder": "Enter description"
  },
  {
    "key": "Solution",
    "name": "Solution",
    "type": "textarea",
    "placeholder": "Enter solution details"
  }
]
```

## User Workflow

### 1. Template Selection (`/templates`)

- **Data Table**: Displays available templates with pagination, sorting, and filtering
- **Search**: Filter templates by title or description
- **Actions**: "Use Template" button to open the editor
- **Responsive Design**: Mobile-friendly layout with adaptive columns

### 2. Template Editor (`/templates/[id]`)

- **Form Interface**: Dynamic form based on template fields
- **Live Preview**: Real-time HTML preview with populated content
- **AI Generation**: Generate content using Google Gemini AI
- **PDF Export**: Download generated document as PDF
- **Reset Functionality**: Revert to original template

### 3. AI Content Generation

The AI system uses a two-step process for content generation:

#### Step 1: AI JSON Generation
The AI analyzes user input and generates structured JSON data:

```json
{
  "Company Name": "Innovatech Solutions",
  "Year": "2023",
  "Executive Summary": "Comprehensive executive summary...",
  "Key Leadership": "CEO: Eleanor Vance\nCTO: Marcus Chen\n...",
  "Financials Table": "Month,Net Profit/Loss ($),Notes\nJanuary,350000,...",
  "Strategic Goals": "Goal 1: Market expansion\nGoal 2: Product development..."
}
```

#### Step 2: Frontend Template Population
The frontend uses the `populateTemplate` function to replace template variables:

```javascript
const populatedHtml = populateTemplate(templateContent, generatedData);
```

#### Smart Content Strategies

Based on field names, the AI applies different strategies:

- **Title/Name fields**: Concise, professional titles (3-8 words)
- **Summary/Overview fields**: Comprehensive executive summaries (2-4 sentences)
- **Description/Details fields**: Detailed, well-written paragraphs
- **Challenge/Problem fields**: Identified problems and challenges
- **Solution/Approach fields**: Clear solutions and strategies
- **Benefit/Value fields**: Key benefits and value propositions
- **Goal/Objective fields**: Clear goals and objectives
- **Timeline/Schedule fields**: Realistic timelines and schedules
- **Budget/Cost fields**: Budget estimates and cost information

#### Format-Specific Instructions

The AI generates content in the correct format based on variable types:

- **Points**: Bulleted list format with newlines (`\n`)
- **Table**: CSV format with headers and data rows
- **Paragraphs**: Multiple paragraphs separated by double newlines (`\n\n`)
- **Heading**: Concise sub-headings (3-6 words)
- **Bold/Italic**: Emphasized phrases or values
- **Text**: Plain, well-formatted text

## Admin Management

### Admin Interface (`/admin/templates`)

- **Data Table**: List all templates with management actions
- **Create Template**: Add new templates with custom fields
- **Edit Template**: Modify existing templates and fields
- **Delete Template**: Remove templates with confirmation
- **Search**: Filter templates by title
- **Responsive Design**: Mobile-friendly admin interface

### Template Creation Process

1. **Basic Information**: Title and description
2. **HTML Content**: Full HTML template with variables
3. **Field Definition**: Configure form fields for user input
4. **JSON Support**: Import/export templates as JSON for easy management
5. **Validation**: Ensure all required fields are present
6. **Save**: Store template in database with tenant isolation

#### JSON Template Format

Templates can be created and managed using JSON format:

```json
{
  "title": "Annual Report Template",
  "description": "A comprehensive annual report template",
  "htmlContent": "<!DOCTYPE html>...",
  "fields": [
    {
      "key": "Company Name",
      "name": "Company Name",
      "type": "input",
      "placeholder": "Enter your company name"
    },
    {
      "key": "Executive Summary",
      "name": "Executive Summary",
      "type": "textarea",
      "placeholder": "Provide a comprehensive overview..."
    }
  ]
}
```

## Technical Implementation

### Authentication & Authorization

- **JWT-based**: Uses Supabase JWT for authentication
- **Tenant Isolation**: Each tenant can only access their own templates
- **Role-based Access**: Admin users can manage templates
- **Server Actions**: Secure server-side operations

### Error Handling

- **Graceful Degradation**: Fallback content for missing fields
- **User Feedback**: Toast notifications for success/error states
- **Loading States**: Proper loading indicators during operations
- **Validation**: Client and server-side validation
- **Controlled Inputs**: Prevents React controlled/uncontrolled input warnings
- **Line Break Normalization**: Handles `\n` characters properly in HTML content

### Performance Optimizations

- **Pagination**: Large template lists are paginated
- **Caching**: Template data is cached appropriately
- **Lazy Loading**: Components load only when needed
- **Responsive Images**: Optimized for different screen sizes

## API Endpoints

### Generate Document (`/api/generate-document`)

**POST** request with:
```json
{
  "templateId": "uuid",
  "userInput": {
    "Company Name": "Innovatech Solutions",
    "Year": "2023",
    "Executive Summary": "User provided summary...",
    "Key Leadership": "CEO: John Doe\nCTO: Jane Smith",
    "Financials Table": "Month,Profit\nJanuary,100000",
    "Strategic Goals": "Goal 1: Market expansion\nGoal 2: Product development"
  }
}
```

**Response**:
```json
{
  "generatedData": {
    "Company Name": "Innovatech Solutions",
    "Year": "2023",
    "Executive Summary": "AI-generated comprehensive summary...",
    "Key Leadership": "CEO: Eleanor Vance\nCTO: Marcus Chen\n...",
    "Financials Table": "Month,Net Profit/Loss ($),Notes\nJanuary,350000,...",
    "Strategic Goals": "Goal 1: Market expansion\nGoal 2: Product development..."
  },
  "templateContent": "<!DOCTYPE html>..."
}
```

### Server Actions

- `getTemplatesAction(tenantId)`: Fetch templates for tenant
- `getTemplateAction(tenantId, templateId)`: Get specific template
- `createTemplateAction(templateData)`: Create new template
- `updateTemplateAction(templateId, updates)`: Update existing template
- `deleteTemplateAction(templateId)`: Delete template

## Template Population Process

### Frontend Template Population

The `populateTemplate` function handles variable replacement:

```javascript
function populateTemplate(templateContent, data) {
  return templateContent.replace(
    /\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?([^}]+?)\s*\}\}/g,
    (match, type, key) => {
      const value = data[key] || `[${key}]`;
      switch (type) {
        case "points":
          return value.split("\n").map(item => 
            item.trim() ? `<li>${item.trim()}</li>` : ""
          ).join("");
        case "table":
          // Convert CSV to HTML table
          const rows = value.split("\n").filter(r => r.trim());
          if (rows.length === 0) return "<table></table>";
          const headers = rows[0].split(",").map(h => `<th>${h.trim()}</th>`).join("");
          const bodyRows = rows.slice(1).map(row =>
            `<tr>${row.split(",").map(c => `<td>${c.trim()}</td>`).join("")}</tr>`
          ).join("");
          return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
        case "paragraphs":
          return value.split("\n\n").map(p => 
            p.trim() ? `<p>${p.trim()}</p>` : ""
          ).join("");
        case "bold":
          return `<strong>${value}</strong>`;
        case "italic":
          return `<em>${value}</em>`;
        case "heading":
          return `<h3>${value}</h3>`;
        default:
          return value;
      }
    }
  );
}
```

### Line Break Normalization

The system handles `\n` characters properly:

```javascript
const normalizeLineBreaks = (text) => {
  return text.replace(/\\n/g, '\n');
};
```

## Best Practices

### Template Design

1. **Responsive HTML**: Use CSS that works on all devices
2. **Clear Variables**: Use descriptive variable names that match AI-generated data keys
3. **Proper Styling**: Include comprehensive CSS for professional appearance
4. **Field Validation**: Ensure all variables have corresponding fields
5. **Variable Matching**: Template variables must exactly match AI-generated data keys

### Content Generation

1. **Detailed Input**: Provide comprehensive user input for better AI results
2. **Field Naming**: Use descriptive field names for better AI understanding
3. **Format Selection**: Choose appropriate variable types for content structure
4. **Testing**: Test templates with various input scenarios
5. **JSON Management**: Use JSON format for easy template import/export

### Security

1. **Input Sanitization**: All user input is properly sanitized
2. **XSS Prevention**: HTML content is safely rendered
3. **Tenant Isolation**: Strict separation between tenants
4. **Authentication**: All operations require proper authentication
5. **Controlled Inputs**: Proper form state management prevents React warnings

## Troubleshooting

### Common Issues

1. **Template Variables Not Replaced**: Ensure template variables match AI-generated data keys exactly
2. **Controlled Input Warnings**: Use explicit `value` and `onChange` props for form inputs
3. **Line Break Issues**: Use `normalizeLineBreaks` function for proper `\n` handling
4. **AI Generation Failures**: Check that template fields match the expected data structure

### Debugging

The system includes comprehensive debugging:
- Console logs for template variable detection
- AI response validation
- Template population process tracking
- Field matching verification