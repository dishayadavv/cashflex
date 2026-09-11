import { Injectable } from '@angular/core';

import {
  Firestore,
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';

import { firebaseApp } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  private firestore: Firestore =
    getFirestore(firebaseApp);


  // ================================
  // ADD DOCUMENT
  // ================================

  async addDocument(
    collectionName: string,
    data: any
  ): Promise<string> {

    const collectionRef =
      collection(
        this.firestore,
        collectionName
      );

    const document =
      await addDoc(
        collectionRef,
        data
      );

    return document.id;
  }


  // ================================
  // GET DOCUMENTS
  // ================================

  async getDocuments(
    collectionName: string
  ): Promise<any[]> {

    const collectionRef =
      collection(
        this.firestore,
        collectionName
      );

    const snapshot =
      await getDocs(collectionRef);

    return snapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));

  }


  // ================================
  // DELETE DOCUMENT
  // ================================

  async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<void> {

    const documentRef =
      doc(
        this.firestore,
        collectionName,
        documentId
      );

    await deleteDoc(documentRef);

  }

}