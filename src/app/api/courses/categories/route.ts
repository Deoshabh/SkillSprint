import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get unique categories from courses
    const categories = await db.course.findMany({
      select: {
        category: true
      },
      distinct: ['category'],
      where: {
        category: {
          not: null
        }
      }
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
