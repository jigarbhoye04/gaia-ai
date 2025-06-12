"""Docstrings for document-related tools."""

GENERATE_DOCUMENT = """
Generate any document format with complete content control and no restrictions on plain text files.

This tool creates files by either writing content directly (plain text) or processing through 
pypandoc (formatted documents). It provides unlimited content generation for code, data, 
configuration, and text files while supporting professional document formats.

✅ USE is_plain_text=True FOR:
- Code files: py, js, ts, jsx, tsx, html, css, php, java, cpp, c, go, rust, dart, swift, kotlin, rb, etc.
- Data files: json, xml, csv, yaml, yml, sql, graphql, etc.
- Configuration: ini, conf, env, toml, properties, etc.
- Text files: txt, md, rst, log, etc.
- Markup: html, xml, svg, etc.
- Any other text-based format

✅ USE is_plain_text=False FOR:
- Formatted documents requiring special processing: pdf, docx, odt, epub, rtf
- Content should be provided in markdown format for these formats

❌ NEVER RESTRICT CONTENT FOR PLAIN TEXT FILES:
- Generate complete applications, scripts, configurations without limitations
- Write full code implementations, not placeholders or comments
- Create comprehensive data files, APIs, or any text content

Examples:
✅ Complete React application: is_plain_text=True, format="jsx"
✅ Full Python script with all logic: is_plain_text=True, format="py"  
✅ Complete API configuration: is_plain_text=True, format="json"
✅ Professional report: is_plain_text=False, format="pdf"
❌ Code with TODO comments instead of implementation
❌ Partial files requiring manual completion

Args:
    content: Complete file content - write EXACTLY what should appear in the final file
    filename: Filename WITHOUT extension (e.g., 'script' not 'script.py')
    format: File extension ONLY (e.g., 'py', 'js', 'html', 'pdf', 'docx', 'txt')
    is_plain_text: ALWAYS True for code/data/config/text files. ONLY False for pdf/docx/odt/epub
    title: Document title - ONLY used when is_plain_text=False
    metadata: Additional metadata - ONLY used when is_plain_text=False
    
Returns:
    Success message with cloudinary file URL for download
"""
