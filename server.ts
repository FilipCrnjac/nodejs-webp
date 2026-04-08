import express, { NextFunction, Request, Response } from 'express';
import path from 'path';

import auth = require('./src/auth/auth');
import authRouter = require('./routes/auth');
import indexRouter = require('./routes/index');
import uploadsRouter = require('./routes/uploads');
import imagesRouter = require('./routes/images');

type HttpError = Error & { status?: number };

const port = parseInt(process.env.PORT || '3003', 10);
// adjust it to your needs (default is inside project)
process.env.UPLOADS_FOLDER = process.env.UPLOADS_FOLDER || path.join(__dirname, '../uploads/images');

// Validate required environment variables at startup
function validateEnvironment(): void {
  const required = ['UPLOADS_FOLDER'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const uploadsFolder = process.env.UPLOADS_FOLDER;
  if (!require('fs').existsSync(uploadsFolder)) {
    console.error(`❌ UPLOADS_FOLDER does not exist: ${uploadsFolder}`);
    process.exit(1);
  }

  console.log(`✓ Environment validated. UPLOADS_FOLDER: ${uploadsFolder}`);
}

validateEnvironment();

function createApp() {
  const app = express();

  app.use(express.json());

  app.use('/', indexRouter);
  app.use('/auth', authRouter);
  app.use('/uploads', uploadsRouter);
  // Auth middleware example of securing /images* routes -> check is user authenticated
  app.use('/images', auth.isAuthenticated, imagesRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    renderErrorPage(res, 404, 'Page Not Found', `The page you're looking for doesn't exist.`);
  });

  // Global error handler
  app.use(function(err: HttpError, req: Request, res: Response, next: NextFunction) {
    void next;

    // Log error details
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      method: req.method,
      path: req.path,
      status: err.status || 500,
      message: err.message,
      ...(req.app.get('env') === 'development' && { stack: err.stack }),
    };

    console.error('❌ Error:', errorInfo);

    const status = err && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Server error!';
    const isDevelopment = req.app.get('env') === 'development';

    // Send JSON for API calls
    if (req.accepts('json') && !req.accepts('html')) {
      return res.status(status).json({
        error: true,
        status,
        message,
        ...(isDevelopment && { stack: err.stack }),
      });
    }

    // Send HTML error page
    renderErrorPage(res, status, getErrorTitle(status), message, isDevelopment ? err.stack : undefined);
  });

  return app;
}

function getErrorTitle(status: number): string {
  const titles: { [key: number]: string } = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Server Error',
    503: 'Service Unavailable',
  };
  return titles[status] || 'Error';
}

function renderErrorPage(res: Response, status: number, title: string, message: string, stack?: string): void {
  const isDevelopment = res.req.app.get('env') === 'development';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${status} - ${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .error-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 100%;
          padding: 60px 30px;
          text-align: center;
        }

        .error-code {
          font-size: 72px;
          font-weight: 700;
          color: #667eea;
          line-height: 1;
          margin-bottom: 16px;
        }

        .error-title {
          font-size: 28px;
          color: #333;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .error-message {
          font-size: 16px;
          color: #666;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        .error-stack {
          background: #f5f5f5;
          border-left: 4px solid #d32f2f;
          padding: 16px;
          border-radius: 6px;
          text-align: left;
          margin-bottom: 30px;
          overflow-x: auto;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          color: #333;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-block;
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .error-info {
          background: #f9f9f9;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 16px;
          text-align: left;
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }

        .error-info dt {
          font-weight: 600;
          color: #333;
          margin-top: 8px;
        }

        .error-info dt:first-child {
          margin-top: 0;
        }

        .error-info dd {
          margin-left: 0;
          margin-bottom: 8px;
          font-family: 'Monaco', 'Courier New', monospace;
          overflow-x: auto;
        }

        @media (max-width: 600px) {
          .error-container {
            padding: 40px 20px;
          }

          .error-code {
            font-size: 56px;
          }

          .error-title {
            font-size: 22px;
          }

          .error-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-code">${status}</div>
        <div class="error-title">${title}</div>
        <div class="error-message">${escapeHtml(message)}</div>
        
        ${isDevelopment && stack ? `
          <div class="error-info">
            <dt>Stack Trace:</dt>
            <dd class="error-stack">${escapeHtml(stack)}</dd>
          </div>
          <div class="error-info">
            <dt>Environment:</dt>
            <dd>Development Mode</dd>
            <dt>Request Path:</dt>
            <dd>${escapeHtml(res.req.path)}</dd>
            <dt>Request Method:</dt>
            <dd>${escapeHtml(res.req.method)}</dd>
          </div>
        ` : ''}

        <div class="error-actions">
          <a href="/" class="btn btn-primary">← Back to Home</a>
          <button onclick="location.reload()" class="btn btn-secondary">Retry</button>
        </div>
      </div>
    </body>
    </html>
  `;

  res.status(status).type('html').send(html);
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

const app = createApp();

if (require.main === module) {
  app.listen(port, () => {
    console.log('Listening at ' + port );
  });
}

export = app;
