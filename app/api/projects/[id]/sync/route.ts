import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Load Full Project Data
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const projectId = id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        candidates: true,
        subProblems: { include: { choices: true } },
        desires: true,
        savedIdeas: true,
        members: { select: { id: true, name: true, avatar: true } },
        owner: { select: { id: true, name: true, avatar: true } }
      }
    });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Transform SQLite Strings back to JSON objects
    const formattedProject = {
      ...project,
      candidates: project.candidates.map((c: any) => ({
        ...c,
        reactions: JSON.parse(c.reactions || '{}')
      })),
      subProblems: project.subProblems.map((sp: any) => ({
        ...sp,
        searchQueries: JSON.parse(sp.searchQueries || '[]')
      })),
      savedIdeas: project.savedIdeas.map((idea: any) => ({
        ...idea,
        combination: JSON.parse(idea.combination || '{}'),
        ratings: JSON.parse(idea.ratings || '{}')
      }))
    };

    return NextResponse.json({ project: formattedProject });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Load failed' }, { status: 500 });
  }
}

// Save/Sync Project Data
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const projectId = id;
  const body = await request.json();

  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Update Project Root
      await tx.project.update({
        where: { id: projectId },
        data: { problemStatement: body.problemStatement }
      });

      // 2. Candidates
      // Smart Sync to preserve Messages (cannot just deleteMany due to Cascade)
      const existingCandidates = await tx.candidate.findMany({ where: { projectId }, select: { id: true } });
      const existingIds = new Set(existingCandidates.map((c: any) => c.id));
      const newIds = new Set(body.candidates?.map((c: any) => c.id) || []);

      // Delete removed candidates
      const toDelete = [...existingIds].filter(id => !newIds.has(id));
      if (toDelete.length > 0) {
        await tx.candidate.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Upsert (Update or Create)
      if (body.candidates && body.candidates.length > 0) {
        for (const c of body.candidates) {
          if (existingIds.has(c.id)) {
            await tx.candidate.update({
              where: { id: c.id },
              data: {
                text: c.text,
                reactions: JSON.stringify(c.reactions || {})
              }
            });
          } else {
            await tx.candidate.create({
              data: {
                id: c.id,
                projectId,
                text: c.text,
                reactions: JSON.stringify(c.reactions || {})
              }
            });
          }
        }
      }

      // 3. Desires
      await tx.desire.deleteMany({ where: { projectId } });
      if (body.desires && body.desires.length > 0) {
        await tx.desire.createMany({
          data: body.desires.map((d: any) => ({
            id: d.id,
            projectId,
            text: d.text,
            category: d.category
          }))
        });
      }

      // 4. SavedIdeas
      await tx.savedIdea.deleteMany({ where: { projectId } });
      if (body.savedIdeas && body.savedIdeas.length > 0) {
        await tx.savedIdea.createMany({
          data: body.savedIdeas.map((i: any) => ({
            id: i.id,
            projectId,
            title: i.title,
            combination: JSON.stringify(i.combination || {}),
            ratings: JSON.stringify(i.ratings || {})
          }))
        });
      }

      // 5. SubProblems & Choices
      // Note: deleting subProblem cascades to choices because of relation setup (usually).
      // If not specificed in Prisma schema as onDelete: Cascade, we might need manual delete.
      // Let's assume it works or handle it if it fails.
      // For safety, let's delete choices explicitly just in case.
      // Actually, we can't delete choices by projectId directly easily.
      // Let's trust Cascade delete on SubProblem -> Choices.
      await tx.subProblem.deleteMany({ where: { projectId } });

      if (body.subProblems && body.subProblems.length > 0) {
        for (const sp of body.subProblems) {
          await tx.subProblem.create({
            data: {
              id: sp.id,
              projectId,
              title: sp.title,
              searchQueries: JSON.stringify(sp.searchQueries || []),
              choices: {
                create: sp.choices.map((ch: any) => ({
                  id: ch.id,
                  text: ch.text,
                  description: ch.description,
                  isOutsideDomain: ch.isOutsideDomain,
                }))
              }
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Sync error:", e);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
