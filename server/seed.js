require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Sprint = require('./models/Sprint');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await Promise.all([User, Workspace, Project, Task, Sprint].map(M => M.deleteMany({})));

  // Create users
  const [alice, bob, carol] = await User.create([
    { name: 'Alice Chen', email: 'alice@taskflow.app', password: 'password123', avatar: '' },
    { name: 'Bob Kumar', email: 'bob@taskflow.app', password: 'password123', avatar: '' },
    { name: 'Carol Wang', email: 'carol@taskflow.app', password: 'password123', avatar: '' },
  ]);
  console.log('Users created');

  // Create workspace
  const workspace = await Workspace.create({
    name: 'Acme Product Team',
    description: 'Building the next generation product',
    color: '#6366f1',
    icon: '🚀',
    owner: alice._id,
    members: [
      { user: alice._id, role: 'owner' },
      { user: bob._id, role: 'admin' },
      { user: carol._id, role: 'member' },
    ],
  });
  console.log('Workspace created');

  // Create project
  const project = await Project.create({
    workspace: workspace._id,
    name: 'Website Redesign',
    description: 'Complete overhaul of the marketing website',
    color: '#8b5cf6',
    icon: '🎨',
    members: [alice._id, bob._id, carol._id],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
  });
  console.log('Project created');

  // Create sprint
  const sprint = await Sprint.create({
    project: project._id,
    name: 'Sprint 1',
    goal: 'Launch new homepage and navigation',
    status: 'active',
    startDate: new Date('2024-01-08'),
    endDate: new Date('2024-01-22'),
  });
  console.log('Sprint created');

  // Create tasks
  await Task.create([
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Design new homepage hero section',
      description: 'Create a compelling hero with clear CTA and product screenshots.',
      status: 'done',
      priority: 'high',
      type: 'feature',
      assignees: [alice._id],
      reporter: alice._id,
      sprint: sprint._id,
      order: 0,
      labels: ['design', 'homepage'],
    },
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Implement responsive navigation',
      description: 'Mobile-first navigation with hamburger menu and smooth transitions.',
      status: 'in-progress',
      priority: 'high',
      type: 'feature',
      assignees: [bob._id],
      reporter: alice._id,
      sprint: sprint._id,
      order: 0,
      labels: ['frontend'],
    },
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Fix broken image on pricing page',
      description: 'The enterprise tier image 404s in production.',
      status: 'todo',
      priority: 'urgent',
      type: 'bug',
      assignees: [carol._id],
      reporter: bob._id,
      sprint: sprint._id,
      order: 0,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Write copy for features section',
      description: 'Compelling feature descriptions with benefit-focused language.',
      status: 'review',
      priority: 'medium',
      type: 'task',
      assignees: [alice._id, carol._id],
      reporter: alice._id,
      sprint: sprint._id,
      order: 0,
      labels: ['content'],
    },
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Set up analytics tracking',
      description: 'Integrate GA4 and set up conversion funnels.',
      status: 'todo',
      priority: 'medium',
      type: 'task',
      assignees: [bob._id],
      reporter: alice._id,
      sprint: sprint._id,
      order: 1,
      estimatedMinutes: 120,
    },
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Performance audit and optimization',
      description: 'Target 95+ Lighthouse score on all core pages.',
      status: 'todo',
      priority: 'low',
      type: 'task',
      assignees: [],
      reporter: alice._id,
      order: 2,
      labels: ['performance'],
    },
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Create component library documentation',
      description: 'Storybook docs for all shared UI components.',
      status: 'in-progress',
      priority: 'low',
      type: 'story',
      assignees: [carol._id],
      reporter: bob._id,
      sprint: sprint._id,
      order: 1,
    },
    {
      project: project._id,
      workspace: workspace._id,
      title: 'Q1 2024 site relaunch',
      description: 'Epic tracking the full website redesign initiative.',
      status: 'in-progress',
      priority: 'high',
      type: 'epic',
      assignees: [alice._id],
      reporter: alice._id,
      order: 2,
      labels: ['epic', 'q1-2024'],
    },
  ]);
  console.log('Tasks created');
  console.log('\n✅ Seed complete!');
  console.log('  alice@taskflow.app / password123 (owner)');
  console.log('  bob@taskflow.app   / password123 (admin)');
  console.log('  carol@taskflow.app / password123 (member)');
  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
