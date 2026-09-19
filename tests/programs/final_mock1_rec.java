public class Main {
 public static void main(String[] args) {
     int[] a = {7, 12, 4, 9};
     System.out.println(trace(a, 0));
 }
 static int trace(int[] a, int i) {
     if (i == a.length - 1) return a[i];
     int x = trace(a, i + 1);
     System.out.println(a[i] - x);
     if (a[i] > x) return a[i];
     else return x;
 }
}
