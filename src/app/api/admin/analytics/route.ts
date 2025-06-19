import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase, User, Course, Feedback, Analytics } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    // Get comprehensive analytics data
    const [
      totalUsers,
      activeCourses,
      totalFeedback,
      recentAnalytics,
      coursesByCategory,
      userGrowthData
    ] = await Promise.all([
      User.countDocuments({}),
      Course.countDocuments({ status: 'published' }),
      Feedback.countDocuments({}),
      Analytics.find({}).sort({ timestamp: -1 }).limit(1000),
      Course.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    // Calculate completion rate (users with enrolled courses / total users)
    const usersWithCourses = await User.countDocuments({ 
      enrolledCourses: { $exists: true, $not: { $size: 0 } } 
    });
    const completionRate = totalUsers > 0 ? ((usersWithCourses / totalUsers) * 100).toFixed(1) : 0;

    // Format user growth data for charts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const userGrowth = userGrowthData.map(item => ({
      month: monthNames[item._id.month - 1],
      users: item.count
    }));

    // Format category data for charts
    const categoryColors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))'
    ];
    
    const popularCategories = coursesByCategory.map((item, index) => ({
      name: item._id || 'Uncategorized',
      value: item.count,
      fill: categoryColors[index % categoryColors.length]
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeCourses,
        completionRate: parseFloat(completionRate as string),
        totalFeedback,
        userGrowth,
        popularCategories,
        recentAnalytics: recentAnalytics.slice(0, 100) // Limit for performance
      }
    });
  } catch (error) {
    console.error('Admin analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
