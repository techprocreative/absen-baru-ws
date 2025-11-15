# FaceSenseAttend

**AI-Powered Facial Recognition Attendance System**

A modern, secure attendance tracking system with facial recognition for both employees and guests, built with React, Express, and PostgreSQL.

## Features

### 👥 Employee Management
- Secure user authentication with role-based access (Admin, HR, Employee)
- Face enrollment with multiple photo capture
- Real-time face verification for check-in/check-out
- Attendance history and analytics
- Department management

### 🤝 Guest Management
- Self-service guest enrollment
- Privacy-focused design with consent management
- Token-based authentication
- Face recognition for contactless check-in/check-out
- Automatic guest data cleanup

### 🔒 Security & Privacy
- Helmet.js security headers
- CORS protection
- Rate limiting on sensitive endpoints
- Session management with secure cookies
- Face data encryption
- GDPR-compliant data retention

### 📊 Monitoring & Logging
- Winston logging with rotation
- Request/response logging
- Error tracking and reporting
- Performance monitoring

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Tailwind CSS** with shadcn/ui components
- **React Webcam** for camera integration
- **Recharts** for analytics visualization

### Backend
- **Express** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **face-api.js** for facial recognition
- **Passport.js** for authentication
- **Express Session** with PostgreSQL store
- **Winston** for logging
- **Node-cron** for scheduled jobs

### Testing
- **Vitest** for unit and integration tests
- **Supertest** for API testing
- Coverage reporting with v8
- E2E testing scripts
- CI/CD with GitHub Actions

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/facesenseattend.git
cd facesenseattend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/facesense
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=5000
```

4. Run database migrations:
```bash
npm run db:push
```

5. Download face recognition models:
```bash
npm run download-models
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Testing

FaceSenseAttend includes comprehensive testing suite. See [Testing Documentation](docs/TESTING.md) for details.

### Run Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:e2e      # End-to-end tests
```

### Test Coverage
- Integration tests for complete workflows
- Performance and load testing
- E2E testing with real HTTP requests
- Automated CI/CD testing

## Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Testing Guide](docs/TESTING.md) - Testing documentation
- [Design Guidelines](design_guidelines.md) - UI/UX guidelines

## Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
├── server/              # Backend Express application
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utilities
│   ├── jobs/            # Scheduled jobs
│   └── __tests__/       # Test suites
├── shared/              # Shared code (schemas, types)
├── migrations/          # Database migrations
├── docs/                # Documentation
└── scripts/             # Build and utility scripts
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Guest Management
- `POST /api/guests/enroll` - Enroll new guest
- `GET /api/guests/status` - Get guest status
- `POST /api/guests/check-in` - Guest check-in
- `POST /api/guests/check-out` - Guest check-out
- `GET /api/guests/history` - Get attendance history

### Employee Management
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

See [API Documentation](docs/API.md) for complete reference.

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting

### Git Workflow
1. Create feature branch from `develop`
2. Make changes and commit
3. Push and create pull request
4. Wait for CI/CD checks
5. Merge after review

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `JWT_SECRET` | JWT signing key | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 5000) |

## Deployment

### Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations
4. Download face recognition models
5. Start server

### Recommended Infrastructure
- PostgreSQL 15+ (managed service recommended)
- Node.js 20+ runtime
- Reverse proxy (nginx/Caddy)
- SSL certificate
- Load balancer for scaling

## Performance Optimization

- Gzip compression enabled
- Static file caching
- Database connection pooling
- Rate limiting
- Session optimization
- Lazy loading for frontend

## Security Features

- Helmet.js security headers
- CORS protection
- SQL injection prevention (Drizzle ORM)
- XSS protection
- CSRF protection
- Rate limiting
- Secure session cookies
- Password hashing with bcrypt
- JWT token authentication

## Privacy & Data Protection

- Face data encrypted at rest
- Consent management
- Data retention policies
- Automatic cleanup of old data
- GDPR compliance features
- Privacy-first design

## Monitoring

### Logging
- Winston logger with file rotation
- Request/response logging
- Error tracking
- Performance metrics

### Health Checks
- `GET /api/health` - Server health status

## Troubleshooting

### Common Issues

**Database Connection Error**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database permissions

**Face Recognition Not Working**
- Ensure models are downloaded
- Check camera permissions
- Verify face-api.js setup

**Session Issues**
- Clear browser cookies
- Verify SESSION_SECRET is set
- Check PostgreSQL session store

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/facesenseattend/issues)
- Documentation: [docs/](docs/)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multiple location support
- [ ] Integration with HR systems
- [ ] Biometric alternatives (fingerprint)
- [ ] Real-time notifications
- [ ] Export reports (PDF/Excel)

## Acknowledgments

- face-api.js for facial recognition
- shadcn/ui for beautiful components
- Drizzle ORM for type-safe database access
- The open-source community

---

Built with ❤️ using modern web technologies