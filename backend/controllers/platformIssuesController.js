const prisma = require('../lib/prisma');

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES   = ['investigating', 'identified', 'monitoring', 'resolved', 'archived'];

// ─── Helpers ─────────────────────────────────────────────

function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}

// ─── GET /api/platform_issues ────────────────────────────

async function getAll(req, res) {
  try {
    const issues = await prisma.platformIssue.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });
    return ok(res, issues);
  } catch (err) {
    console.error('[platformIssues:getAll]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── POST /api/platform_issues ───────────────────────────

async function create(req, res) {
  const { title, platform, priority, status, summary, description, reportedBy, assignedTo } = req.body;

  if (!title)    return fail(res, 'Field title is required');
  if (!platform) return fail(res, 'Field platform is required');
  if (!priority) return fail(res, 'Field priority is required');
  if (!status)   return fail(res, 'Field status is required');
  if (!summary)  return fail(res, 'Field summary is required');

  if (!VALID_PRIORITIES.includes(priority)) {
    return fail(res, `Field priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  if (!VALID_STATUSES.includes(status)) {
    return fail(res, `Field status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (reportedBy !== undefined && reportedBy !== null) {
    const user = await prisma.user.findUnique({ where: { id: reportedBy } });
    if (!user) return fail(res, 'Provided reportedBy user does not exist', 404);
  }

  if (assignedTo !== undefined && assignedTo !== null) {
    const user = await prisma.user.findUnique({ where: { id: assignedTo } });
    if (!user) return fail(res, 'Provided assignedTo user does not exist', 404);
  }

  try {
    const issue = await prisma.platformIssue.create({
      data: {
        title,
        platform,
        priority,
        status,
        summary,
        description: description ?? null,
        reportedBy:  reportedBy  ?? null,
        assignedTo:  assignedTo  ?? null,
      },
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });
    return ok(res, issue, 'Platform issue created successfully', 201);
  } catch (err) {
    console.error('[platformIssues:create]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── PUT /api/platform_issues/:id ────────────────────────

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return fail(res, 'Invalid issue id');

  const { title, platform, priority, status, summary, description, reportedBy, assignedTo } = req.body;

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return fail(res, `Field priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return fail(res, `Field status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (reportedBy !== undefined && reportedBy !== null) {
    const user = await prisma.user.findUnique({ where: { id: reportedBy } });
    if (!user) return fail(res, 'Provided reportedBy user does not exist', 404);
  }

  if (assignedTo !== undefined && assignedTo !== null) {
    const user = await prisma.user.findUnique({ where: { id: assignedTo } });
    if (!user) return fail(res, 'Provided assignedTo user does not exist', 404);
  }

  // Build update payload with only the fields that were sent
  const data = {};
  if (title       !== undefined) data.title       = title;
  if (platform    !== undefined) data.platform    = platform;
  if (priority    !== undefined) data.priority    = priority;
  if (status      !== undefined) data.status      = status;
  if (summary     !== undefined) data.summary     = summary;
  if (description !== undefined) data.description = description;
  if (reportedBy  !== undefined) data.reportedBy  = reportedBy;
  if (assignedTo  !== undefined) data.assignedTo  = assignedTo;

  if (Object.keys(data).length === 0) {
    return fail(res, 'No fields provided to update');
  }

  try {
    const issue = await prisma.platformIssue.update({
      where: { id },
      data,
      include: {
        reporter: { select: { id: true, name: true, role: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });
    return ok(res, issue, 'Platform issue updated successfully');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'Record not found', 404);
    console.error('[platformIssues:update]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── DELETE /api/platform_issues/:id ─────────────────────

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return fail(res, 'Invalid issue id');

  try {
    await prisma.platformIssue.delete({ where: { id } });
    return ok(res, null, 'Platform issue deleted successfully');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, 'Record not found', 404);
    console.error('[platformIssues:remove]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── GET /api/platform_issues/:id/comments ───────────────

async function getComments(req, res) {
  const issueId = parseInt(req.params.id, 10);
  if (isNaN(issueId)) return fail(res, 'Invalid issue id');

  try {
    const comments = await prisma.platformIssueComment.findMany({
      where:   { issueId },
      orderBy: { createdAt: 'asc' },
    });
    return ok(res, comments);
  } catch (err) {
    console.error('[platformIssues:getComments]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

// ─── POST /api/platform_issues/:id/comments ──────────────

async function addComment(req, res) {
  const issueId = parseInt(req.params.id, 10);
  if (isNaN(issueId)) return fail(res, 'Invalid issue id');

  const { authorName, text } = req.body;
  if (!authorName) return fail(res, 'Field authorName is required');
  if (!text)       return fail(res, 'Field text is required');

  const issue = await prisma.platformIssue.findUnique({ where: { id: issueId } });
  if (!issue) return fail(res, 'Issue not found', 404);

  try {
    const comment = await prisma.platformIssueComment.create({
      data: { issueId, authorName, text },
    });
    return ok(res, comment, 'Comment added successfully', 201);
  } catch (err) {
    console.error('[platformIssues:addComment]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { getAll, create, update, remove, getComments, addComment };
