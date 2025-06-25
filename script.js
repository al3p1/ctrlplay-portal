// Initialize Supabase with your credentials
const SUPABASE_URL = 'https://vyhemhabtgdgzrxcnzua.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aGVtaGFidGdkZ3pyeGNuenVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MDQyOTgsImV4cCI6MjA2NjM4MDI5OH0.CdvN0BwvkRU-lNXS2LLbJ9KfWiEVc82xvU6HT5RFyJo';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Storage buckets
const BUCKETS = {
    ANNOUNCEMENTS: 'announcements',
    SUGGESTIONS: 'suggestions',
    FILES: 'files',
    CHAT: 'chat',
    AVATARS: 'avatars'
};

// Current user session
let currentUser = {
    code: '',
    role: '',
    name: '',
    loginTime: '',
    avatar: '',
    customName: ''
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles.js with optimized configuration
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#4facfe",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: true, mode: "push" },
                resize: true
            },
            modes: {
                grab: { distance: 140, line_linked: { opacity: 1 } },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true
    });
    
    // Handle Enter key on login
    document.getElementById('accessCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validateAccess();
        }
    });

    // Handle avatar upload preview
    document.getElementById('avatarUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('avatarPreview').innerHTML = '';
                document.getElementById('avatarPreview').style.backgroundImage = `url(${event.target.result})`;
                document.getElementById('avatarPreview').style.backgroundSize = 'cover';
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle announcement attachment
    document.getElementById('announcementAttachment').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('announcementFileName').textContent = file.name;
        }
    });

    // Handle suggestion attachment
    document.getElementById('suggestionAttachment').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('suggestionFileName').textContent = file.name;
        }
    });

    // Handle file upload
    document.getElementById('fileUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('uploadFileName').textContent = file.name;
        }
    });

    // Handle chat attachment
    document.getElementById('chatAttachment').addEventListener('change', function(e) {
        // Implementation for chat attachments
    });

    // Auto-logout on page refresh/close
    window.addEventListener('beforeunload', function() {
        logout();
    });
    
    // Simulate active users
    setInterval(() => {
        if (currentUser.code) {
            updateActiveUser();
            if (currentUser.role === 'Admin') {
                loadActiveUsers();
            }
        }
    }, 30000);
});

async function validateAccess() {
    const code = document.getElementById('accessCode').value.trim().toUpperCase();
    const errorDiv = document.getElementById('errorMessage');

    if (!code) {
        errorDiv.textContent = 'Please enter an access code.';
        errorDiv.style.display = 'block';
        return;
    }

    // Show loading animation
    showLoadingOverlay('Validating access...');

    try {
        // Check access code in Supabase
        const { data, error } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', code)
            .single();

        if (data) {
            // Valid code - log user in
            currentUser = {
                code: code,
                role: data.role,
                name: data.custom_name || data.name,
                loginTime: new Date().toLocaleString(),
                avatar: data.avatar,
                customName: data.custom_name || ''
            };

            // Log the access
            await logAccess(code);

            updateLoadingText('Access granted! Loading portal...');
            
            setTimeout(() => {
                hideLoadingOverlay();
                
                // Show main app
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
                document.getElementById('userRole').textContent = currentUser.role;
                document.getElementById('userName').textContent = currentUser.name;

                // Show admin features if admin
                if (currentUser.role === 'Admin') {
                    document.querySelectorAll('.admin-only').forEach(el => {
                        el.style.display = 'block';
                    });
                }

                // Load initial content
                loadAnnouncements();
                loadSuggestions();
                loadFiles();
                loadAccessLogs();
                loadStockGuide();
                loadCodesList();
                loadChatUsers();
                loadProfileData();
                loadActiveUsers();

                errorDiv.style.display = 'none';
                showWelcomeMessage();
            }, 1000);

        } else {
            // Invalid code
            updateLoadingText('Invalid access code...');
            setTimeout(() => {
                hideLoadingOverlay();
                errorDiv.textContent = 'Invalid access code. Please try again.';
                errorDiv.style.display = 'block';
                document.getElementById('accessCode').value = '';
            }, 1000);
        }
    } catch (error) {
        console.error('Error validating access:', error);
        hideLoadingOverlay();
        errorDiv.textContent = 'Error connecting to server. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function logAccess(code) {
    try {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const language = navigator.language;
        const loginTime = new Date().toISOString();
        
        await supabase.from('access_logs').insert({
            code: code,
            role: currentUser.role,
            name: currentUser.name,
            login_time: loginTime,
            user_agent: userAgent,
            platform: platform,
            language: language
        });
        
        // Add to active users
        await supabase.from('active_users').upsert({
            code: code,
            name: currentUser.name,
            role: currentUser.role,
            last_active: new Date().toISOString()
        }, { onConflict: 'code' });
    } catch (error) {
        console.error('Error logging access:', error);
    }
}

async function updateActiveUser() {
    if (!currentUser.code) return;
    
    try {
        await supabase.from('active_users').upsert({
            code: currentUser.code,
            name: currentUser.name,
            role: currentUser.role,
            last_active: new Date().toISOString()
        }, { onConflict: 'code' });
    } catch (error) {
        console.error('Error updating active user:', error);
    }
}

// Enhanced logout with animation
async function logout() {
    showLoadingOverlay('Signing out...');
    
    try {
        // Remove from active users
        if (currentUser.code) {
            await supabase.from('active_users').delete().eq('code', currentUser.code);
        }
        
        currentUser = { code: '', role: '', name: '', loginTime: '', avatar: '', customName: '' };
        hideLoadingOverlay();
        
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('accessCode').value = '';
        document.getElementById('errorMessage').style.display = 'none';
        
        // Hide admin features
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        
        showNotification('Successfully logged out', 'info');
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Loading overlay functions
function showLoadingOverlay(text = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div class="loading-spinner"></div>
            <div class="loading-text" id="loadingText">${text}</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function updateLoadingText(text) {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }
}

// Navigation functions
function showSection(section) {
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });

    document.getElementById(section).classList.add('active');
    event.target.closest('.nav-item').classList.add('active');

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }

    // Load specific content if needed
    if (section === 'chat' && currentChatUser) {
        loadChatMessages(currentChatUser);
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleChatSidebar() {
    document.getElementById('chatSidebar').classList.toggle('collapsed');
}

// Announcements functions
async function loadAnnouncements() {
    try {
        const { data: announcements, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('announcementsList');
        container.innerHTML = '';

        announcements.forEach(announcement => {
            const card = document.createElement('div');
            card.className = 'card float-up';
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${announcement.title}</div>
                    <div class="card-date">${new Date(announcement.created_at).toLocaleDateString()}</div>
                </div>
                <p>${announcement.content}</p>
                ${announcement.attachment_url ? `
                <div class="file-attachment">
                    <i class="fas fa-paperclip file-icon"></i>
                    <div class="file-name">${announcement.attachment_url.split('/').pop()}</div>
                    <i class="fas fa-download file-download" onclick="downloadFile('${announcement.attachment_url}')"></i>
                </div>
                ` : ''}
                <div class="comment-section">
                    <div class="comment">
                        <div class="comment-author">
                            <div class="comment-avatar" style="background-color: ${stringToColor(announcement.author_code)}">
                                ${announcement.author_name.charAt(0).toUpperCase()}
                            </div>
                            ${announcement.author_name}
                        </div>
                        <div class="comment-date">Posted on ${new Date(announcement.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                ${currentUser.role === 'Admin' || currentUser.code === announcement.author_code ? `
                    <div class="edit-controls">
                        <button class="btn-edit" onclick="editAnnouncement('${announcement.id}')">Edit</button>
                        <button class="btn-danger" onclick="deleteAnnouncement('${announcement.id}')">Delete</button>
                    </div>
                ` : ''}
            `;
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading announcements:', error);
        showNotification('Failed to load announcements', 'error');
    }
}

async function postAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const attachmentInput = document.getElementById('announcementAttachment');
    
    if (!title || !content) {
        showNotification('Please fill in both title and content', 'error');
        return;
    }
    
    try {
        let attachmentUrl = null;
        
        if (attachmentInput.files.length > 0) {
            const file = attachmentInput.files[0];
            const filePath = `announcement_${Date.now()}_${file.name}`;
            
            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from(BUCKETS.ANNOUNCEMENTS)
                .upload(filePath, file);
            
            if (uploadError) throw uploadError;
            
            attachmentUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKETS.ANNOUNCEMENTS}/${filePath}`;
        }
        
        // Save to database
        const { error } = await supabase.from('announcements').insert({
            title,
            content,
            author_code: currentUser.code,
            author_name: currentUser.name,
            attachment_url: attachmentUrl
        });
        
        if (error) throw error;
        
        // Clear form
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementContent').value = '';
        document.getElementById('announcementAttachment').value = '';
        document.getElementById('announcementFileName').textContent = 'No file chosen';
        
        // Reload announcements
        loadAnnouncements();
        showNotification('Announcement posted successfully!', 'success');
        playNotificationSound();
    } catch (error) {
        console.error('Error posting announcement:', error);
        showNotification('Failed to post announcement', 'error');
    }
}

async function deleteAnnouncement(id) {
    try {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
        
        loadAnnouncements();
        showNotification('Announcement deleted', 'info');
    } catch (error) {
        console.error('Error deleting announcement:', error);
        showNotification('Failed to delete announcement', 'error');
    }
}

// Suggestions functions
async function loadSuggestions() {
    try {
        const { data: suggestions, error } = await supabase
            .from('suggestions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('suggestionsList');
        container.innerHTML = '';

        suggestions.forEach(suggestion => {
            const card = document.createElement('div');
            card.className = 'card float-up';
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${suggestion.title}</div>
                    <div class="card-date">${new Date(suggestion.created_at).toLocaleDateString()}</div>
                </div>
                <p>${suggestion.content}</p>
                ${suggestion.attachment_url ? `
                <div class="file-attachment">
                    <i class="fas fa-paperclip file-icon"></i>
                    <div class="file-name">${suggestion.attachment_url.split('/').pop()}</div>
                    <i class="fas fa-download file-download" onclick="downloadFile('${suggestion.attachment_url}')"></i>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div>
                        <span class="status-badge status-${suggestion.type}">${suggestion.type.toUpperCase()}</span>
                        <small style="margin-left: 15px;">
                            <div class="comment-author">
                                <div class="comment-avatar" style="background-color: ${stringToColor(suggestion.author_code)}">
                                    ${suggestion.author_name.charAt(0).toUpperCase()}
                                </div>
                                ${suggestion.author_name}
                            </div>
                        </small>
                    </div>
                    <div class="vote-section">
                        <button class="vote-btn ${suggestion.user_vote === 'up' ? 'voted' : ''}" onclick="vote('${suggestion.id}', 'up')">
                            👍 ${suggestion.upvotes || 0}
                        </button>
                        <button class="vote-btn downvote ${suggestion.user_vote === 'down' ? 'voted' : ''}" onclick="vote('${suggestion.id}', 'down')">
                            👎 ${suggestion.downvotes || 0}
                        </button>
                    </div>
                </div>
                <div class="comment-section" id="comments-${suggestion.id}">
                    <h4>Comments</h4>
                    <div id="comments-container-${suggestion.id}"></div>
                    <div class="form-group" style="margin-top: 15px;">
                        <textarea class="form-input" id="comment-${suggestion.id}" placeholder="Add a comment"></textarea>
                        <button class="btn-primary" style="margin-top: 10px;" onclick="addComment('${suggestion.id}')">Post Comment</button>
                    </div>
                </div>
                ${suggestion.author_code === currentUser.code ? `
                    <div class="edit-controls">
                        <button class="btn-edit" onclick="editSuggestion('${suggestion.id}')">Edit</button>
                        <button class="btn-danger" onclick="deleteSuggestion('${suggestion.id}')">Delete</button>
                    </div>
                ` : ''}
            `;
            
            container.appendChild(card);
            loadComments(suggestion.id);
        });
    } catch (error) {
        console.error('Error loading suggestions:', error);
        showNotification('Failed to load suggestions', 'error');
    }
}

async function submitSuggestion() {
    const title = document.getElementById('suggestionTitle').value.trim();
    const content = document.getElementById('suggestionContent').value.trim();
    const type = document.getElementById('suggestionType').value;
    const attachmentInput = document.getElementById('suggestionAttachment');
    
    if (!title || !content) {
        showNotification('Please fill in both title and description', 'error');
        return;
    }
    
    try {
        let attachmentUrl = null;
        
        if (attachmentInput.files.length > 0) {
            const file = attachmentInput.files[0];
            const filePath = `suggestion_${Date.now()}_${file.name}`;
            
            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from(BUCKETS.SUGGESTIONS)
                .upload(filePath, file);
            
            if (uploadError) throw uploadError;
            
            attachmentUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKETS.SUGGESTIONS}/${filePath}`;
        }
        
        // Save to database
        const { error } = await supabase.from('suggestions').insert({
            title,
            content,
            type,
            author_code: currentUser.code,
            author_name: currentUser.name,
            attachment_url: attachmentUrl,
            upvotes: 0,
            downvotes: 0
        });
        
        if (error) throw error;
        
        // Clear form
        document.getElementById('suggestionTitle').value = '';
        document.getElementById('suggestionContent').value = '';
        document.getElementById('suggestionType').value = 'suggestion';
        document.getElementById('suggestionAttachment').value = '';
        document.getElementById('suggestionFileName').textContent = 'No file chosen';
        
        // Reload suggestions
        loadSuggestions();
        showNotification('Suggestion submitted successfully!', 'success');
        playNotificationSound();
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showNotification('Failed to submit suggestion', 'error');
    }
}

// Files functions
async function loadFiles() {
    try {
        const { data: files, error } = await supabase
            .from('files')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('filesList');
        container.innerHTML = '';

        files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'card float-up';
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${file.name}</div>
                    <div class="card-date">${new Date(file.created_at).toLocaleDateString()}</div>
                </div>
                <div style="display: flex; align-items: center; margin-top: 10px;">
                    <span class="status-badge">${file.type.toUpperCase()}</span>
                    <small style="margin-left: 15px;">
                        <div class="comment-author">
                            <div class="comment-avatar" style="background-color: ${stringToColor(file.uploader_code)}">
                                ${file.uploader_name.charAt(0).toUpperCase()}
                            </div>
                            ${file.uploader_name}
                        </div>
                    </small>
                </div>
                <div class="file-attachment" style="margin-top: 15px;">
                    <i class="fas ${getFileIcon(file.type)} file-icon"></i>
                    <div class="file-name">${file.name}</div>
                    <i class="fas fa-download file-download" onclick="downloadFile('${file.file_url}')"></i>
                </div>
                ${currentUser.role === 'Admin' ? `
                    <div class="edit-controls">
                        <button class="btn-danger" onclick="deleteFile('${file.id}')">Delete</button>
                    </div>
                ` : ''}
            `;
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading files:', error);
        showNotification('Failed to load files', 'error');
    }
}

function getFileIcon(type) {
    switch(type) {
        case 'document': return 'fa-file-alt';
        case 'image': return 'fa-file-image';
        case 'spreadsheet': return 'fa-file-excel';
        case 'presentation': return 'fa-file-powerpoint';
        default: return 'fa-file';
    }
}

async function uploadFile() {
    const name = document.getElementById('fileName').value.trim();
    const type = document.getElementById('fileType').value;
    const fileInput = document.getElementById('fileUpload');
    
    if (!name || !fileInput.files.length) {
        showNotification('Please fill in file name and select a file', 'error');
        return;
    }
    
    try {
        const file = fileInput.files[0];
        const filePath = `file_${Date.now()}_${file.name}`;
        
        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKETS.FILES)
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKETS.FILES}/${filePath}`;
        
        // Save to database
        const { error } = await supabase.from('files').insert({
            name: name,
            type: type,
            uploader_code: currentUser.code,
            uploader_name: currentUser.name,
            file_url: fileUrl
        });
        
        if (error) throw error;
        
        // Clear form
        document.getElementById('fileName').value = '';
        document.getElementById('fileType').value = 'document';
        document.getElementById('fileUpload').value = '';
        document.getElementById('uploadFileName').textContent = 'No file chosen';
        
        // Reload files
        loadFiles();
        showNotification('File uploaded successfully!', 'success');
    } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('Failed to upload file', 'error');
    }
}

function downloadFile(url) {
    window.open(url, '_blank');
}

// Admin functions
async function loadActiveUsers() {
    if (currentUser.role !== 'Admin') return;
    
    try {
        const { data: users, error } = await supabase
            .from('active_users')
            .select('*')
            .order('last_active', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('activeUsersList');
        container.innerHTML = '';
        
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'log-entry';
            userElement.innerHTML = `
                <div>
                    <div class="comment-author">
                        <div class="comment-avatar" style="background-color: ${stringToColor(user.code)}">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        ${user.name} (${user.role})
                    </div>
                    <small>Last active: ${new Date(user.last_active).toLocaleString()}</small>
                </div>
                <button class="force-logout-btn" onclick="forceLogout('${user.code}')">
                    <i class="fas fa-sign-out-alt"></i> Force Logout
                </button>
            `;
            container.appendChild(userElement);
        });
    } catch (error) {
        console.error('Error loading active users:', error);
        showNotification('Failed to load active users', 'error');
    }
}

async function forceLogout(userCode) {
    if (confirm(`Are you sure you want to force this user to logout?`)) {
        try {
            await supabase.from('active_users').delete().eq('code', userCode);
            loadActiveUsers();
            showNotification('User has been logged out', 'success');
        } catch (error) {
            console.error('Error forcing logout:', error);
            showNotification('Failed to force logout', 'error');
        }
    }
}

// Helper function to generate color from string
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" 
               style="margin-right: 10px; font-size: 1.2rem;"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after animation
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function playNotificationSound() {
    const sound = document.getElementById('notificationSound');
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Audio play prevented:", e));
}

// Welcome message after login
function showWelcomeMessage() {
    setTimeout(() => {
        showNotification(`Welcome to CTRLPLAY Portal, ${currentUser.name}!`, 'success');
        playNotificationSound();
    }, 500);
}