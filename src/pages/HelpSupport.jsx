import { HelpCircle, Mail, Phone, FileText, ExternalLink } from 'lucide-react';

const HelpSupport = () => {
    return (
        <div className="help-support">
            <div className="page-header">
                <h1><HelpCircle size={24} /> Help & Support</h1>
                <p>Get assistance and learn how to use CleanGuard QC</p>
            </div>

            <div className="support-grid">
                <div className="support-card contact">
                    <h2>Contact Support</h2>
                    <div className="contact-item">
                        <Mail size={20} />
                        <div>
                            <h3>Email Us</h3>
                            <p>support@cleanguard.com</p>
                        </div>
                    </div>
                    <div className="contact-item">
                        <Phone size={20} />
                        <div>
                            <h3>Call Us</h3>
                            <p>+1 (555) 123-4567</p>
                        </div>
                    </div>
                </div>

                <div className="support-card faqs">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-item">
                        <h3>How do I reset my password?</h3>
                        <p>Contact your administrator to reset your password. Admins can manage user credentials from the User Management page.</p>
                    </div>
                    <div className="faq-item">
                        <h3>How do I create a new inspection?</h3>
                        <p>Go to the Inspections page and click "New Inspection". Follow the wizard to select a location and template.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Can I edit a submitted inspection?</h3>
                        <p>No, once an inspection is submitted, it is locked for integrity. You can only view or download the PDF.</p>
                    </div>
                </div>

                <div className="support-card resources">
                    <h2>Resources</h2>
                    <a href="#" className="resource-link">
                        <FileText size={18} /> User Guide PDF <ExternalLink size={14} />
                    </a>
                    <a href="#" className="resource-link">
                        <FileText size={18} /> Video Tutorials <ExternalLink size={14} />
                    </a>
                    <a href="#" className="resource-link">
                        <FileText size={18} /> API Documentation <ExternalLink size={14} />
                    </a>
                </div>
            </div>

            <style>{`
                .help-support { max-width: 1000px; margin: 0 auto; padding: 20px; }
                .page-header { margin-bottom: 40px; text-align: center; }
                .page-header h1 { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; }
                .page-header p { color: var(--text-muted); }
                
                .support-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
                .support-card { background: white; padding: 30px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                .support-card h2 { margin-top: 0; margin-bottom: 24px; font-size: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
                
                .contact-item { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
                .contact-item h3 { margin: 0 0 4px 0; font-size: 16px; }
                .contact-item p { margin: 0; color: var(--primary-color); font-weight: 500; }
                
                .faq-item { margin-bottom: 20px; }
                .faq-item h3 { font-size: 16px; margin-bottom: 8px; color: var(--text-dark); }
                .faq-item p { margin: 0; font-size: 14px; color: var(--text-muted); line-height: 1.5; }
                
                .resource-link { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: var(--text-dark); margin-bottom: 10px; transition: background 0.2s; font-weight: 500; }
                .resource-link:hover { background: #f1f5f9; color: var(--primary-color); }
            `}</style>
        </div>
    );
};

export default HelpSupport;
