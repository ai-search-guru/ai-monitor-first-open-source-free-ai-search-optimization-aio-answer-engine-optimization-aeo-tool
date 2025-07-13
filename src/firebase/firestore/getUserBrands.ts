import firebase_app from "../config";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Get the Firestore instance
const db = getFirestore(firebase_app);

// Interface for brand analytics data
export interface BrandBasicData {
  brandMentions: number;
  brandMentionsChange: number;
  brandValidity: number;
  brandValidityChange: number;
  lastUpdated: string;
  linkValidity: number;
  linkValidityChange: number;
  sentimentChange: number;
  sentimentScore: number;
}

// Interface for brand data
export interface UserBrand {
  id: string;
  userId: string;
  domain: string;
  website?: string;
  companyName: string;
  shortDescription?: string;
  productsAndServices?: string[];
  keywords?: string[];
  queries?: Array<{
    keyword: string;
    query: string;
    category: 'Awareness' | 'Interest' | 'Consideration' | 'Purchase';
    containsBrand: 0 | 1;
    selected: boolean;
  }>;
  createdAt: string;
  updatedAt?: string;
  timestamp?: number;
  totalQueries?: number;
  setupComplete?: boolean;
  currentStep?: number;
  queryDistribution?: {
    awareness: number;
    interest: number;
    consideration: number;
    purchase: number;
  };
  aiAnalysis?: {
    providersUsed: string[];
    totalCost: number;
    completedAt: string;
    requestId: string | null;
  } | null;
  // New brand analytics data
  brandsbasicData?: BrandBasicData;
  // Query processing results
  queryProcessingResults?: QueryProcessingResult[];
  lastProcessedAt?: any;
}

// Interface for query processing results
export interface QueryProcessingResult {
  date: string;
  processingSessionId: string; // Unique identifier for each processing session
  processingSessionTimestamp: string; // When this processing session started
  results: {
    chatgpt?: {
      response: string;
      error?: string;
      timestamp: string;
      responseTime?: number;
      tokenCount?: any;
    };
    gemini?: {
      response: string;
      error?: string;
      timestamp: string;
      responseTime?: number;
      tokenCount?: any;
    };
    perplexity?: {
      response: string;
      error?: string;
      timestamp: string;
      responseTime?: number;
      tokenCount?: any;
    };
  };
  query: string;
  keyword: string;
  category: string;
}

// Function to get user brands from v8userbrands collection
export async function getUserBrands(userId: string) {
  let result: UserBrand[] = [];
  let error = null;

  try {
    // Create a query to get brands for the specific user
    const brandsRef = collection(db, 'v8userbrands');
    const q = query(brandsRef, where('userId', '==', userId));
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    // Convert the documents to UserBrand objects
    result = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserBrand));

  } catch (e) {
    console.error('Error fetching user brands:', e);
    error = e;
  }

  return { result, error };
} 

// Function to update brand with query processing results (appends new session data)
export async function updateBrandWithQueryResults(
  brandId: string,
  queryResults: QueryProcessingResult[]
) {
  let error = null;

  try {
    const brandRef = doc(db, 'v8userbrands', brandId);
    
    // First, fetch the current brand data to get existing results
    const brandDoc = await getDoc(brandRef);
    
    let existingResults: QueryProcessingResult[] = [];
    if (brandDoc.exists()) {
      const brandData = brandDoc.data() as UserBrand;
      existingResults = brandData.queryProcessingResults || [];
    }

    // Check if we're updating an existing session or creating a new one
    const currentSessionId = queryResults[0]?.processingSessionId;
    
    if (currentSessionId) {
      // Remove any existing results from the same processing session (for incremental updates)
      existingResults = existingResults.filter(
        result => result.processingSessionId !== currentSessionId
      );
      
      console.log(`🔄 Processing session ${currentSessionId}: Removed existing session data, now adding ${queryResults.length} new results`);
    }
    
    // Append the new query results
    const allResults = [...existingResults, ...queryResults];
    
    // Update the brand document with all results (existing + new session)
    await setDoc(brandRef, {
      queryProcessingResults: allResults,
      lastProcessedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log(`✅ Brand updated with query results:`, {
      brandId,
      newSessionResults: queryResults.length,
      totalResults: allResults.length,
      processingSessionId: currentSessionId
    });

  } catch (e) {
    console.error('Error updating brand with query results:', e);
    error = e;
  }

  return { error };
} 